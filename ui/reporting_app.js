const state = {
  operations_period: [],
  links: [],
  pendingCsvFile: null,
};

const STORAGE_KEY = "link_building_saved_reports_v1";

const mockOperationsPeriods = [
  {
    period_name: "2026-01 Outreach",
    period_start: "2026-01-01",
    period_end: "2026-01-31",
    lead_count: 180,
    salary_per_builder: 3200,
    link_builders_count: 2,
    tools_cost: 800,
  },
  {
    period_name: "2026-02 Outreach",
    period_start: "2026-02-01",
    period_end: "2026-02-28",
    lead_count: 210,
    salary_per_builder: 3400,
    link_builders_count: 2,
    tools_cost: 850,
  },
];

const mockLinks = [
  {link_id: 1, landing_page: "https://brand.example/casino-bonus", backlink_url: "https://news-a.com/brand-casino-review", backlink_ftds_amount: 6, backlinks_deposits_amount: 850, backlink_cost: 260, landing_page_ftds_amount: 19, landing_page_ftds_deposits: 2590, placement_date: "2026-01-05", period_id: 1, sessions: 980, allocation_weight: 1.2},
  {link_id: 2, landing_page: "https://brand.example/casino-bonus", backlink_url: "https://review-hub.com/top-casino-bonuses", backlink_ftds_amount: 8, backlinks_deposits_amount: 1200, backlink_cost: 320, landing_page_ftds_amount: 19, landing_page_ftds_deposits: 2590, placement_date: "2026-01-14", period_id: 1, sessions: 1240, allocation_weight: 1.0},
  {link_id: 3, landing_page: "https://brand.example/casino-bonus", backlink_url: "https://bet-tips.net/casino-free-spins", backlink_ftds_amount: 5, backlinks_deposits_amount: 540, backlink_cost: 210, landing_page_ftds_amount: 19, landing_page_ftds_deposits: 2590, placement_date: "2026-01-21", period_id: 1, sessions: 760, allocation_weight: 0.8},
  {link_id: 4, landing_page: "https://brand.example/sportsbook-guide", backlink_url: "https://sportsdata.blog/best-sportsbooks", backlink_ftds_amount: 11, backlinks_deposits_amount: 1800, backlink_cost: 400, landing_page_ftds_amount: 21, landing_page_ftds_deposits: 3220, placement_date: "2026-02-07", period_id: 2, sessions: 1600, allocation_weight: 1.5},
  {link_id: 5, landing_page: "https://brand.example/poker-app", backlink_url: "https://poker-insights.io/mobile-poker-apps", backlink_ftds_amount: 7, backlinks_deposits_amount: 970, backlink_cost: 230, landing_page_ftds_amount: 16, landing_page_ftds_deposits: 2380, placement_date: "2026-02-13", period_id: 2, sessions: 820, allocation_weight: 1.0},
  {link_id: 6, landing_page: "https://brand.example/poker-app", backlink_url: "https://affiliate-world.org/poker-app-promo", backlink_ftds_amount: 9, backlinks_deposits_amount: 1410, backlink_cost: 340, landing_page_ftds_amount: 16, landing_page_ftds_deposits: 2380, placement_date: "2026-02-24", period_id: 2, sessions: 1100, allocation_weight: 1.3},
];

const requiredCsvHeaders = [
  "link_id",
  "landing_page",
  "backlink_url",
  "backlink_ftds_amount",
  "backlinks_deposits_amount",
  "backlink_cost",
  "landing_page_ftds_amount",
  "landing_page_ftds_deposits",
  "placement_date",
  "period_id",
  "sessions",
  "allocation_weight",
];

const money = (n) => Number(n || 0).toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 2});
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

function renderSummaryCards(summary) {
  const cards = [
    ["Operational Cost", money(summary.allocated_operational_cost)],
    ["Direct Link Cost", money(summary.direct_cost)],
    ["Fully Loaded Cost", money(summary.full_cost)],
    ["Leads", summary.leads],
    ["Links", summary.links],
    ["Cost per Lead", money(summary.cost_per_lead)],
    ["Operational Cost per Link", money(summary.operational_cost_per_link)],
    ["Fully Loaded Cost per Link", money(summary.fully_loaded_cost_per_link)],
    ["Lead-to-Link Conversion", pct(summary.lead_to_link_conversion_rate)],
    ["Revenue", money(summary.revenue)],
    ["Revenue per Dollar", summary.revenue_per_dollar.toFixed(4)],
  ];

  const html = cards
    .map(([label, value]) => `<article class="card"><h3>${label}</h3><p>${value}</p></article>`)
    .join("");

  document.getElementById("summaryCards").innerHTML = html;
}

function addHandlers() {
  document.getElementById("loadMockDataBtn").addEventListener("click", loadMockData);
  document.getElementById("recalculateBtn").addEventListener("click", refresh);
  document.getElementById("saveReportBtn").addEventListener("click", saveCurrentReport);
  document.getElementById("exportPdfBtn").addEventListener("click", () => window.print());
  document.getElementById("loadSavedReportBtn").addEventListener("click", loadSelectedReport);
  document.getElementById("clearSavedReportsBtn").addEventListener("click", clearSavedReports);
  document.getElementById("linksCsvInput").addEventListener("change", (event) => {
    state.pendingCsvFile = event.target.files?.[0] || null;
  });
  document.getElementById("uploadCsvBtn").addEventListener("click", handleCsvUpload);
  document.getElementById("linkForm").addEventListener("submit", handleManualLinkSubmit);

  document.getElementById("operationsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const row = readForm(e.target);
    const nextPeriodId = (Math.max(0, ...state.operations_period.map((p) => p.period_id || 0)) + 1);

    state.operations_period.push({
      period_id: nextPeriodId,
      period_name: row.period_name,
      period_start: row.period_start,
      period_end: row.period_end,
      lead_count: toNum(row.lead_count),
      salary_per_builder: toNum(row.salary_per_builder),
      link_builders_count: toNum(row.link_builders_count),
      tools_cost: toNum(row.tools_cost),
      labor_cost: toNum(row.salary_per_builder) * toNum(row.link_builders_count),
    });
    e.target.reset();
    refresh();
  });
}

function normalizeLinkInput(obj) {
  return {
    link_id: toNum(obj.link_id),
    landing_page: obj.landing_page,
    backlink_url: obj.backlink_url,
    backlink_ftds_amount: toNum(obj.backlink_ftds_amount),
    backlinks_deposits_amount: toNum(obj.backlinks_deposits_amount),
    backlink_cost: toNum(obj.backlink_cost),
    landing_page_ftds_amount: toNum(obj.landing_page_ftds_amount),
    landing_page_ftds_deposits: toNum(obj.landing_page_ftds_deposits),
    placement_date: obj.placement_date,
    period_id: toNum(obj.period_id),
    sessions: toNum(obj.sessions),
    allocation_weight: toNum(obj.allocation_weight),
  };
}

function handleManualLinkSubmit(event) {
  event.preventDefault();
  const errorEl = document.getElementById("csvError");
  const row = normalizeLinkInput(readForm(event.target));
  if (state.links.some((l) => l.link_id === row.link_id)) {
    errorEl.textContent = `Duplicate link_id ${row.link_id}. Use a unique link_id.`;
    return;
  }

  state.links.push(row);
  errorEl.textContent = "";
  event.target.reset();
  refresh();
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((h) => h.trim());

  for (const h of requiredCsvHeaders) {
    if (!headers.includes(h)) {
      throw new Error(`Missing required CSV column: ${h}`);
    }
  }

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const obj = Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));

    return normalizeLinkInput(obj);
  });
}

function handleCsvUpload() {
  const file = state.pendingCsvFile;
  const errorEl = document.getElementById("csvError");
  if (!file) {
    errorEl.textContent = "Choose a CSV file first, then click Upload CSV.";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = parseCsv(String(reader.result || ""));
      const existing = new Set(state.links.map((l) => l.link_id));
      const deduped = parsed.filter((l) => !existing.has(l.link_id));
      const skipped = parsed.length - deduped.length;
      state.links = [...state.links, ...deduped];
      errorEl.textContent = skipped > 0 ? `Imported ${deduped.length} rows, skipped ${skipped} duplicate link_id rows.` : "";
      document.getElementById("linksCsvInput").value = "";
      state.pendingCsvFile = null;
      refresh();
    } catch (error) {
      errorEl.textContent = error.message;
    }
  };
  reader.readAsText(file);
}

function buildLinkPerf(startDate, endDate) {
  const links = state.links.filter((l) => inRange(l.placement_date, startDate, endDate));

  const periodWeights = new Map();
  for (const link of links) {
    const current = periodWeights.get(link.period_id) || {sumWeight: 0, count: 0};
    current.sumWeight += link.allocation_weight || 0;
    current.count += 1;
    periodWeights.set(link.period_id, current);
  }

  return links.map((link) => {
    const op = state.operations_period.find((o) => o.period_id === link.period_id);
    const p = periodWeights.get(link.period_id) || {sumWeight: 0, count: 0};
    const periodOperational = op ? op.labor_cost + op.tools_cost : 0;

    let allocatedOperationalCost = 0;
    if (p.sumWeight > 0) {
      allocatedOperationalCost = periodOperational * (link.allocation_weight / p.sumWeight);
    } else if (p.count > 0) {
      allocatedOperationalCost = periodOperational / p.count;
    }

    const revenue = link.backlinks_deposits_amount;
    const fullCost = allocatedOperationalCost + link.backlink_cost;
    const profit = revenue - fullCost;
    const roi = fullCost > 0 ? profit / fullCost : 0;

    return {
      link_id: link.link_id,
      landing_page: link.landing_page,
      backlink_url: link.backlink_url,
      sessions: link.sessions,
      backlink_ftds_amount: link.backlink_ftds_amount,
      money_brought: revenue,
      backlink_cost: link.backlink_cost,
      allocated_operational_cost: allocatedOperationalCost,
      full_cost: fullCost,
      profit,
      roi,
      lead_count: op ? op.lead_count : 0,
      period_operational_cost: periodOperational,
      landing_page_ftds_amount: link.landing_page_ftds_amount,
      landing_page_ftds_deposits: link.landing_page_ftds_deposits,
    };
  });
}

function buildSummary(linkPerf) {
  const grossOperational = linkPerf.reduce((a, r) => a + r.period_operational_cost, 0);
  const allocatedOperational = linkPerf.reduce((a, r) => a + r.allocated_operational_cost, 0);
  const directCost = linkPerf.reduce((a, r) => a + r.backlink_cost, 0);
  const fullCost = linkPerf.reduce((a, r) => a + r.full_cost, 0);
  const leads = linkPerf.reduce((a, r) => a + r.lead_count, 0);
  const links = linkPerf.length;
  const revenue = linkPerf.reduce((a, r) => a + r.money_brought, 0);

  return {
    gross_operational_cost_reference: grossOperational,
    allocated_operational_cost: allocatedOperational,
    direct_cost: directCost,
    full_cost: fullCost,
    leads,
    links,
    cost_per_lead: leads ? grossOperational / leads : 0,
    operational_cost_per_link: links ? allocatedOperational / links : 0,
    fully_loaded_cost_per_link: links ? fullCost / links : 0,
    lead_to_link_conversion_rate: leads ? links / leads : 0,
    revenue,
    revenue_per_dollar: fullCost ? revenue / fullCost : 0,
  };
}

function buildUrlPerf(linkPerf) {
  const grouped = new Map();
  for (const row of linkPerf) {
    const current = grouped.get(row.landing_page) || {
      url: row.landing_page,
      total_links: 0,
      total_link_revenue: 0,
      total_link_cost: 0,
      url_generated_ftds: 0,
      url_generated_deposits: 0,
    };

    current.total_links += 1;
    current.total_link_revenue += row.money_brought;
    current.total_link_cost += row.full_cost;
    current.url_generated_ftds = Math.max(current.url_generated_ftds, row.landing_page_ftds_amount);
    current.url_generated_deposits = Math.max(current.url_generated_deposits, row.landing_page_ftds_deposits);
    grouped.set(row.landing_page, current);
  }

  return [...grouped.values()].map((g) => {
    const profit = g.url_generated_deposits - g.total_link_cost;
    return {
      url: g.url,
      total_links: g.total_links,
      total_link_revenue: money(g.total_link_revenue),
      total_link_cost: money(g.total_link_cost),
      url_generated_ftds: g.url_generated_ftds,
      url_generated_deposits: money(g.url_generated_deposits),
      profit: money(profit),
      roi: pct(g.total_link_cost ? profit / g.total_link_cost : 0),
    };
  });
}

function refreshOperationsTable() {
  renderTable(
    "operationsTable",
    ["period_id", "period_name", "period_start", "period_end", "lead_count", "salary_per_builder", "link_builders_count", "labor_cost", "tools_cost"],
    state.operations_period,
  );
}

function refreshLinksTable() {
  renderTable(
    "linksTable",
    requiredCsvHeaders,
    state.links,
  );
}

function getCurrentReport() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const linkPerf = buildLinkPerf(startDate, endDate);
  const summary = buildSummary(linkPerf);
  const urlPerf = buildUrlPerf(linkPerf);
  return {startDate, endDate, summary, linkPerf, urlPerf};
}

function refresh() {
  refreshOperationsTable();
  refreshLinksTable();

  const report = getCurrentReport();
  renderSummaryCards(report.summary);

  renderTable(
    "linkPerfTable",
    ["link_id", "landing_page", "backlink_url", "sessions", "backlink_ftds_amount", "money_brought", "backlink_cost", "full_cost", "profit", "roi"],
    report.linkPerf.map((r) => ({
      ...r,
      money_brought: money(r.money_brought),
      backlink_cost: money(r.backlink_cost),
      full_cost: money(r.full_cost),
      profit: money(r.profit),
      roi: pct(r.roi),
    })),
  );

  renderTable(
    "urlPerfTable",
    ["url", "total_links", "total_link_revenue", "total_link_cost", "url_generated_ftds", "url_generated_deposits", "profit", "roi"],
    report.urlPerf,
  );
}

function getSavedReports() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function setSavedReports(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function refreshSavedReportsDropdown() {
  const select = document.getElementById("savedReportsSelect");
  const reports = getSavedReports();

  if (!reports.length) {
    select.innerHTML = '<option value="">No saved reports</option>';
    return;
  }

  select.innerHTML = reports
    .map((r, idx) => `<option value="${idx}">${r.label}</option>`)
    .join("");
}

function saveCurrentReport() {
  const report = getCurrentReport();
  const saved = getSavedReports();
  const label = `${new Date().toISOString()} | ${report.startDate || "all"} -> ${report.endDate || "all"}`;

  saved.unshift({
    label,
    stateSnapshot: structuredClone(state),
    filters: {startDate: report.startDate, endDate: report.endDate},
  });

  setSavedReports(saved.slice(0, 20));
  refreshSavedReportsDropdown();
}

function loadSelectedReport() {
  const select = document.getElementById("savedReportsSelect");
  const idx = Number(select.value);
  const saved = getSavedReports();
  const selected = saved[idx];
  if (!selected) return;

  state.operations_period = selected.stateSnapshot.operations_period || [];
  state.links = selected.stateSnapshot.links || [];

  document.getElementById("startDate").value = selected.filters.startDate || "";
  document.getElementById("endDate").value = selected.filters.endDate || "";
  refresh();
}

function clearSavedReports() {
  setSavedReports([]);
  refreshSavedReportsDropdown();
}

function loadMockData() {
  state.operations_period = mockOperationsPeriods.map((p, i) => ({
    ...p,
    period_id: i + 1,
    labor_cost: p.salary_per_builder * p.link_builders_count,
  }));
  state.links = mockLinks.map((l) => ({...l}));

  document.getElementById("startDate").value = "2026-01-01";
  document.getElementById("endDate").value = "2026-02-28";
  document.getElementById("csvError").textContent = "";
  refresh();
}

addHandlers();
refreshSavedReportsDropdown();
refresh();
