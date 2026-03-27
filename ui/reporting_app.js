const state = {
  operations_period: [],
  urls: [],
  links: [],
  link_attribution: [],
  seenConversionEvents: new Set(),
  nextPeriodId: 1,
  nextUrlId: 1,
  nextLinkId: 1,
};

const mockData = {
  operations_period: [
    {
      period_name: "2026-01 Outreach",
      period_start: "2026-01-01",
      period_end: "2026-01-31",
      lead_count: 180,
      labor_cost: 4200,
      tools_cost: 800,
      overhead_cost: 1000,
    },
    {
      period_name: "2026-02 Outreach",
      period_start: "2026-02-01",
      period_end: "2026-02-28",
      lead_count: 210,
      labor_cost: 4600,
      tools_cost: 850,
      overhead_cost: 1100,
    },
  ],
  urls: [
    {canonical_url: "https://brand.example/casino-bonus", campaign_name: "Casino SEO"},
    {canonical_url: "https://brand.example/sportsbook-guide", campaign_name: "Sportsbook SEO"},
    {canonical_url: "https://brand.example/poker-app", campaign_name: "Poker SEO"},
  ],
  links: [
    {url_id: 1, period_id: 1, source_domain: "news-a.com", placement_date: "2026-01-05", direct_link_cost: 260, sessions: 980, allocation_weight: 1.2},
    {url_id: 1, period_id: 1, source_domain: "review-hub.com", placement_date: "2026-01-14", direct_link_cost: 320, sessions: 1240, allocation_weight: 1.0},
    {url_id: 2, period_id: 1, source_domain: "bet-tips.net", placement_date: "2026-01-21", direct_link_cost: 210, sessions: 760, allocation_weight: 0.8},
    {url_id: 2, period_id: 2, source_domain: "sportsdata.blog", placement_date: "2026-02-07", direct_link_cost: 400, sessions: 1600, allocation_weight: 1.5},
    {url_id: 3, period_id: 2, source_domain: "poker-insights.io", placement_date: "2026-02-13", direct_link_cost: 230, sessions: 820, allocation_weight: 1.0},
    {url_id: 3, period_id: 2, source_domain: "affiliate-world.org", placement_date: "2026-02-24", direct_link_cost: 340, sessions: 1100, allocation_weight: 1.3},
  ],
  link_attribution: [
    {link_id: 1, conversion_event_id: "evt_1001", conversion_date: "2026-01-10", conversions: 6, revenue: 850, first_time_deposit_count: 3, attribution_weight: 1},
    {link_id: 1, conversion_event_id: "evt_1002", conversion_date: "2026-01-18", conversions: 4, revenue: 540, first_time_deposit_count: 2, attribution_weight: 1},
    {link_id: 2, conversion_event_id: "evt_1003", conversion_date: "2026-01-22", conversions: 8, revenue: 1200, first_time_deposit_count: 4, attribution_weight: 1},
    {link_id: 3, conversion_event_id: "evt_1004", conversion_date: "2026-01-27", conversions: 5, revenue: 610, first_time_deposit_count: 2, attribution_weight: 1},
    {link_id: 4, conversion_event_id: "evt_1005", conversion_date: "2026-02-10", conversions: 11, revenue: 1800, first_time_deposit_count: 6, attribution_weight: 1},
    {link_id: 5, conversion_event_id: "evt_1006", conversion_date: "2026-02-16", conversions: 7, revenue: 970, first_time_deposit_count: 3, attribution_weight: 1},
    {link_id: 6, conversion_event_id: "evt_1007", conversion_date: "2026-02-25", conversions: 9, revenue: 1410, first_time_deposit_count: 5, attribution_weight: 1},
    {link_id: 4, conversion_event_id: "evt_1008", conversion_date: "2026-02-27", conversions: 3, revenue: 420, first_time_deposit_count: 1, attribution_weight: 1},
  ],
};

const money = (n) => Number(n || 0).toFixed(2);
const pct = (n) => `${(Number(n || 0) * 100).toFixed(2)}%`;

function inRange(dateText, start, end) {
  if (!dateText) return false;
  const d = new Date(dateText);
  if (start && d < new Date(start)) return false;
  if (end && d > new Date(end)) return false;
  return true;
}

function readForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function toNum(v) {
  return Number(v || 0);
}

function renderTable(elementId, columns, rows) {
  const el = document.getElementById(elementId);
  if (!rows.length) {
    el.innerHTML = `<tr><td>No data</td></tr>`;
    return;
  }
  const head = `<tr>${columns.map((c) => `<th>${c}</th>`).join("")}</tr>`;
  const body = rows
    .map((row) => `<tr>${columns.map((c) => `<td>${row[c] ?? ""}</td>`).join("")}</tr>`)
    .join("");
  el.innerHTML = head + body;
}

function addHandlers() {
  document.getElementById("loadMockDataBtn").addEventListener("click", loadMockData);
  document.getElementById("operationsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const row = readForm(e.target);
    state.operations_period.push({
      period_id: state.nextPeriodId++,
      period_name: row.period_name,
      period_start: row.period_start,
      period_end: row.period_end,
      lead_count: toNum(row.lead_count),
      labor_cost: toNum(row.labor_cost),
      tools_cost: toNum(row.tools_cost),
      overhead_cost: toNum(row.overhead_cost),
    });
    e.target.reset();
    refresh();
  });

  document.getElementById("urlForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const row = readForm(e.target);
    state.urls.push({
      url_id: state.nextUrlId++,
      canonical_url: row.canonical_url,
      campaign_name: row.campaign_name || "",
    });
    e.target.reset();
    refresh();
  });

  document.getElementById("linkForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const row = readForm(e.target);
    state.links.push({
      link_id: state.nextLinkId++,
      url_id: toNum(row.url_id),
      period_id: toNum(row.period_id),
      source_domain: row.source_domain,
      placement_date: row.placement_date,
      direct_link_cost: toNum(row.direct_link_cost),
      sessions: toNum(row.sessions),
      allocation_weight: toNum(row.allocation_weight),
    });
    e.target.reset();
    refresh();
  });

  document.getElementById("attributionForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const row = readForm(e.target);
    const errorEl = document.getElementById("attributionError");
    if (state.seenConversionEvents.has(row.conversion_event_id)) {
      errorEl.textContent = "Duplicate conversion_event_id blocked (no double counting).";
      return;
    }

    state.seenConversionEvents.add(row.conversion_event_id);
    errorEl.textContent = "";
    state.link_attribution.push({
      link_id: toNum(row.link_id),
      conversion_event_id: row.conversion_event_id,
      conversion_date: row.conversion_date,
      conversions: toNum(row.conversions),
      revenue: toNum(row.revenue),
      first_time_deposit_count: toNum(row.first_time_deposit_count),
      attribution_weight: toNum(row.attribution_weight),
    });
    e.target.reset();
    refresh();
  });

  document.getElementById("recalculateBtn").addEventListener("click", refresh);
}

function resetState() {
  state.operations_period = [];
  state.urls = [];
  state.links = [];
  state.link_attribution = [];
  state.seenConversionEvents = new Set();
  state.nextPeriodId = 1;
  state.nextUrlId = 1;
  state.nextLinkId = 1;
}

function loadMockData() {
  resetState();

  for (const op of mockData.operations_period) {
    state.operations_period.push({...op, period_id: state.nextPeriodId++});
  }

  for (const url of mockData.urls) {
    state.urls.push({...url, url_id: state.nextUrlId++});
  }

  for (const link of mockData.links) {
    state.links.push({...link, link_id: state.nextLinkId++});
  }

  for (const attr of mockData.link_attribution) {
    if (!state.seenConversionEvents.has(attr.conversion_event_id)) {
      state.seenConversionEvents.add(attr.conversion_event_id);
      state.link_attribution.push({...attr});
    }
  }

  document.getElementById("startDate").value = "2026-01-01";
  document.getElementById("endDate").value = "2026-02-28";
  document.getElementById("attributionError").textContent = "";
  refresh();
}

function buildLinkPerf(startDate, endDate) {
  const links = state.links.filter((l) => inRange(l.placement_date, startDate, endDate));

  const periodWeights = new Map();
  for (const link of links) {
    const curr = periodWeights.get(link.period_id) || {sumWeight: 0, count: 0};
    curr.sumWeight += link.allocation_weight || 0;
    curr.count += 1;
    periodWeights.set(link.period_id, curr);
  }

  return links.map((link) => {
    const op = state.operations_period.find((o) => o.period_id === link.period_id);
    const url = state.urls.find((u) => u.url_id === link.url_id);
    const p = periodWeights.get(link.period_id) || {sumWeight: 0, count: 0};
    const periodOperational = op ? op.labor_cost + op.tools_cost + op.overhead_cost : 0;

    let allocatedOperationalCost = 0;
    if (p.sumWeight > 0) {
      allocatedOperationalCost = periodOperational * (link.allocation_weight / p.sumWeight);
    } else if (p.count > 0) {
      allocatedOperationalCost = periodOperational / p.count;
    }

    const attrs = state.link_attribution.filter(
      (a) => a.link_id === link.link_id && inRange(a.conversion_date, startDate, endDate),
    );

    const conversions = attrs.reduce((acc, a) => acc + a.conversions * a.attribution_weight, 0);
    const revenue = attrs.reduce((acc, a) => acc + a.revenue * a.attribution_weight, 0);
    const ftds = attrs.reduce((acc, a) => acc + a.first_time_deposit_count * a.attribution_weight, 0);
    const fullCost = allocatedOperationalCost + link.direct_link_cost;
    const profit = revenue - fullCost;
    const roi = fullCost > 0 ? profit / fullCost : 0;

    return {
      link_id: link.link_id,
      url_id: link.url_id,
      url: url ? url.canonical_url : `Unknown URL ${link.url_id}`,
      sessions: link.sessions,
      lead_count: op ? op.lead_count : 0,
      period_operational_cost: periodOperational,
      allocated_operational_cost: allocatedOperationalCost,
      direct_link_cost: link.direct_link_cost,
      conversions,
      revenue,
      ftds,
      full_cost: fullCost,
      profit,
      roi,
    };
  });
}

function buildSummary(linkPerf) {
  const grossOperational = linkPerf.reduce((a, r) => a + r.period_operational_cost, 0);
  const allocatedOperational = linkPerf.reduce((a, r) => a + r.allocated_operational_cost, 0);
  const directCost = linkPerf.reduce((a, r) => a + r.direct_link_cost, 0);
  const fullCost = linkPerf.reduce((a, r) => a + r.full_cost, 0);
  const leads = linkPerf.reduce((a, r) => a + r.lead_count, 0);
  const links = linkPerf.length;
  const revenue = linkPerf.reduce((a, r) => a + r.revenue, 0);

  return {
    gross_operational_cost_reference: money(grossOperational),
    allocated_operational_cost: money(allocatedOperational),
    direct_cost: money(directCost),
    full_cost: money(fullCost),
    leads,
    links,
    cost_per_lead: money(leads ? grossOperational / leads : 0),
    operational_cost_per_link: money(links ? allocatedOperational / links : 0),
    fully_loaded_cost_per_link: money(links ? fullCost / links : 0),
    lead_to_link_conversion_rate: pct(leads ? links / leads : 0),
    revenue: money(revenue),
    revenue_per_dollar: (fullCost ? revenue / fullCost : 0).toFixed(4),
  };
}

function buildUrlPerf(linkPerf) {
  const grouped = new Map();
  for (const row of linkPerf) {
    const current = grouped.get(row.url) || {
      url: row.url,
      total_links: 0,
      total_revenue: 0,
      total_cost: 0,
      total_ftds: 0,
    };
    current.total_links += 1;
    current.total_revenue += row.revenue;
    current.total_cost += row.full_cost;
    current.total_ftds += row.ftds;
    grouped.set(row.url, current);
  }

  return [...grouped.values()].map((g) => {
    const profit = g.total_revenue - g.total_cost;
    return {
      url: g.url,
      total_links: g.total_links,
      total_revenue: money(g.total_revenue),
      total_cost: money(g.total_cost),
      profit: money(profit),
      roi: pct(g.total_cost ? profit / g.total_cost : 0),
      cost_per_ftd: g.total_ftds > 0 ? money(g.total_cost / g.total_ftds) : "N/A",
    };
  });
}

function refreshInputsTables() {
  renderTable("operationsTable", ["period_id", "period_name", "period_start", "period_end", "lead_count", "labor_cost", "tools_cost", "overhead_cost"], state.operations_period);
  renderTable("urlsTable", ["url_id", "canonical_url", "campaign_name"], state.urls);
  renderTable("linksTable", ["link_id", "url_id", "period_id", "source_domain", "placement_date", "direct_link_cost", "sessions", "allocation_weight"], state.links);
  renderTable("attributionTable", ["link_id", "conversion_event_id", "conversion_date", "conversions", "revenue", "first_time_deposit_count", "attribution_weight"], state.link_attribution);
}

function refresh() {
  refreshInputsTables();

  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const linkPerf = buildLinkPerf(startDate, endDate);
  const summary = buildSummary(linkPerf);
  const urlPerf = buildUrlPerf(linkPerf);

  renderTable("summaryTable", Object.keys(summary), [summary]);
  renderTable(
    "linkPerfTable",
    ["link_id", "url", "sessions", "conversions", "revenue", "full_cost", "profit", "roi"],
    linkPerf.map((r) => ({
      ...r,
      conversions: r.conversions.toFixed(2),
      revenue: money(r.revenue),
      full_cost: money(r.full_cost),
      profit: money(r.profit),
      roi: pct(r.roi),
    })),
  );
  renderTable("urlPerfTable", ["url", "total_links", "total_revenue", "total_cost", "profit", "roi", "cost_per_ftd"], urlPerf);
}

addHandlers();
refresh();
