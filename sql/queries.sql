-- Parameter contract:
-- :start_date (DATE), :end_date (DATE)

-- Base CTE used by all report sections.
WITH filtered_links AS (
    SELECT l.*
    FROM links l
    WHERE l.placement_date BETWEEN :start_date AND :end_date
),
period_weight AS (
    SELECT
        fl.period_id,
        SUM(NULLIF(fl.allocation_weight, 0)) AS period_weight_sum,
        COUNT(*) AS links_in_period
    FROM filtered_links fl
    GROUP BY fl.period_id
),
link_perf AS (
    SELECT
        fl.link_id,
        fl.url_id,
        fl.sessions,
        fl.direct_link_cost,
        fl.allocation_weight,
        op.lead_count,
        (op.labor_cost + op.tools_cost + op.overhead_cost) AS period_operational_cost,

        -- Weighted operational allocation (future-ready).
        CASE
            WHEN pw.period_weight_sum > 0
                THEN (op.labor_cost + op.tools_cost + op.overhead_cost) * (fl.allocation_weight / pw.period_weight_sum)
            WHEN pw.links_in_period > 0
                THEN (op.labor_cost + op.tools_cost + op.overhead_cost) / pw.links_in_period
            ELSE 0
        END AS allocated_operational_cost,

        COALESCE(SUM(la.conversions * la.attribution_weight), 0) AS conversions,
        COALESCE(SUM(la.revenue * la.attribution_weight), 0) AS revenue,
        COALESCE(SUM(la.first_time_deposit_count * la.attribution_weight), 0) AS ftds
    FROM filtered_links fl
    JOIN operations_period op ON op.period_id = fl.period_id
    LEFT JOIN period_weight pw ON pw.period_id = fl.period_id
    LEFT JOIN link_attribution la
        ON la.link_id = fl.link_id
       AND la.conversion_date BETWEEN :start_date AND :end_date
    GROUP BY
        fl.link_id,
        fl.url_id,
        fl.sessions,
        fl.direct_link_cost,
        fl.allocation_weight,
        op.lead_count,
        op.labor_cost,
        op.tools_cost,
        op.overhead_cost,
        pw.period_weight_sum,
        pw.links_in_period
)
SELECT * FROM link_perf;

-- 1) Operations Summary
WITH link_perf AS (
    SELECT * FROM (
        -- reuse base CTE by materializing externally in application layer if preferred
        SELECT 1
    ) x
)
SELECT
    SUM(period_operational_cost) AS gross_operational_cost_reference,
    SUM(allocated_operational_cost) AS allocated_operational_cost,
    SUM(direct_link_cost) AS direct_cost,
    SUM(allocated_operational_cost + direct_link_cost) AS full_cost,
    SUM(lead_count) AS leads,
    COUNT(*) AS links,
    CASE WHEN SUM(lead_count) > 0 THEN SUM(period_operational_cost) / SUM(lead_count) ELSE 0 END AS cost_per_lead,
    CASE WHEN COUNT(*) > 0 THEN SUM(allocated_operational_cost) / COUNT(*) ELSE 0 END AS operational_cost_per_link,
    CASE WHEN COUNT(*) > 0 THEN SUM(allocated_operational_cost + direct_link_cost) / COUNT(*) ELSE 0 END AS fully_loaded_cost_per_link,
    CASE WHEN SUM(lead_count) > 0 THEN COUNT(*)::NUMERIC / SUM(lead_count) ELSE 0 END AS lead_to_link_conversion_rate,
    SUM(revenue) AS revenue,
    CASE WHEN SUM(allocated_operational_cost + direct_link_cost) > 0
         THEN SUM(revenue) / SUM(allocated_operational_cost + direct_link_cost)
         ELSE 0 END AS revenue_per_dollar
FROM link_perf;

-- 2) Link-Level Performance
WITH link_perf AS (
    SELECT * FROM (
        SELECT 1
    ) x
)
SELECT
    lp.link_id,
    u.canonical_url AS url,
    lp.sessions,
    lp.conversions,
    lp.revenue,
    lp.allocated_operational_cost + lp.direct_link_cost AS full_cost,
    lp.revenue - (lp.allocated_operational_cost + lp.direct_link_cost) AS profit,
    CASE WHEN (lp.allocated_operational_cost + lp.direct_link_cost) > 0
         THEN (lp.revenue - (lp.allocated_operational_cost + lp.direct_link_cost))
              / (lp.allocated_operational_cost + lp.direct_link_cost)
         ELSE 0 END AS roi
FROM link_perf lp
JOIN urls u ON u.url_id = lp.url_id
ORDER BY roi DESC, profit DESC;

-- 3) URL-Level Performance (aggregates link data, no recomputation outside links)
WITH link_perf AS (
    SELECT * FROM (
        SELECT 1
    ) x
)
SELECT
    u.canonical_url AS url,
    COUNT(lp.link_id) AS total_links,
    SUM(lp.revenue) AS total_revenue,
    SUM(lp.allocated_operational_cost + lp.direct_link_cost) AS total_cost,
    SUM(lp.revenue) - SUM(lp.allocated_operational_cost + lp.direct_link_cost) AS profit,
    CASE WHEN SUM(lp.allocated_operational_cost + lp.direct_link_cost) > 0
         THEN (SUM(lp.revenue) - SUM(lp.allocated_operational_cost + lp.direct_link_cost))
              / SUM(lp.allocated_operational_cost + lp.direct_link_cost)
         ELSE 0 END AS roi,
    CASE WHEN SUM(lp.ftds) > 0
         THEN SUM(lp.allocated_operational_cost + lp.direct_link_cost) / SUM(lp.ftds)
         ELSE NULL END AS cost_per_ftd
FROM link_perf lp
JOIN urls u ON u.url_id = lp.url_id
GROUP BY u.canonical_url
ORDER BY profit DESC;
