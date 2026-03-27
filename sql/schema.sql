-- Link-Building Profitability System
-- PostgreSQL-compatible schema

CREATE TABLE operations_period (
    period_id                BIGSERIAL PRIMARY KEY,
    period_name              TEXT NOT NULL,
    period_start             DATE NOT NULL,
    period_end               DATE NOT NULL,
    labor_cost               NUMERIC(14,2) NOT NULL DEFAULT 0,
    tools_cost               NUMERIC(14,2) NOT NULL DEFAULT 0,
    overhead_cost            NUMERIC(14,2) NOT NULL DEFAULT 0,
    lead_count               INTEGER NOT NULL DEFAULT 0,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_period_dates CHECK (period_end >= period_start)
);

CREATE TABLE urls (
    url_id                    BIGSERIAL PRIMARY KEY,
    canonical_url             TEXT NOT NULL UNIQUE,
    campaign_name             TEXT,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE links (
    link_id                   BIGSERIAL PRIMARY KEY,
    url_id                    BIGINT NOT NULL REFERENCES urls(url_id),
    period_id                 BIGINT NOT NULL REFERENCES operations_period(period_id),
    source_domain             TEXT NOT NULL,
    placement_date            DATE NOT NULL,
    direct_link_cost          NUMERIC(14,2) NOT NULL DEFAULT 0,
    sessions                  INTEGER NOT NULL DEFAULT 0,
    allocation_weight         NUMERIC(10,4) NOT NULL DEFAULT 1.0,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_links_url_date ON links(url_id, placement_date);
CREATE INDEX idx_links_period ON links(period_id);

CREATE TABLE link_attribution (
    attribution_id            BIGSERIAL PRIMARY KEY,
    link_id                   BIGINT NOT NULL REFERENCES links(link_id),
    conversion_event_id       TEXT NOT NULL,
    conversion_date           DATE NOT NULL,
    conversions               INTEGER NOT NULL DEFAULT 1,
    revenue                   NUMERIC(14,2) NOT NULL DEFAULT 0,
    first_time_deposit_count  INTEGER NOT NULL DEFAULT 0,
    attribution_weight        NUMERIC(10,4) NOT NULL DEFAULT 1.0,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent double counting of conversion events at link attribution ingestion.
    CONSTRAINT uq_conversion_event UNIQUE (conversion_event_id),
    CONSTRAINT chk_weight CHECK (attribution_weight >= 0),
    CONSTRAINT chk_conversions_non_negative CHECK (conversions >= 0),
    CONSTRAINT chk_ftd_non_negative CHECK (first_time_deposit_count >= 0)
);

CREATE INDEX idx_attribution_link_date ON link_attribution(link_id, conversion_date);

-- Optional helper view for operations totals.
CREATE VIEW operations_costs AS
SELECT
    period_id,
    period_name,
    period_start,
    period_end,
    labor_cost,
    tools_cost,
    overhead_cost,
    lead_count,
    (labor_cost + tools_cost + overhead_cost) AS operational_cost
FROM operations_period;
