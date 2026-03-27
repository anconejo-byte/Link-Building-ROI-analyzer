# Dashboard UI Layout (3 Sections)

## Global Filters
- Date range picker (`start_date`, `end_date`) applied to all sections.
- Optional campaign/url filter hooks can be added later.

---

## 1) Operations Summary (Top KPI Band)
Render as cards + compact table:

- Cost Structure
  - Allocated Operational Cost
  - Direct Cost
  - Fully Loaded Cost
- Volume
  - Leads
  - Links
- Efficiency
  - Cost per Lead
  - Operational Cost per Link
  - Fully Loaded Cost per Link
  - Lead-to-Link Conversion Rate
  - Revenue per Dollar

### Suggested component tree
```tsx
<DashboardPage>
  <FiltersBar />
  <OperationsSummaryCards data={operationsSummary} />
  <CostBreakdownTable data={operationsSummary} />
</DashboardPage>
```

---

## 2) Link-Level Performance (Detail Table)
Columns:
- `link_id`
- `url`
- `sessions`
- `conversions`
- `revenue`
- `full_cost`
- `profit`
- `roi`

UX:
- Sort default by ROI descending.
- Conditional formatting: negative profit in red.
- Pagination for large volumes.

### Suggested component tree
```tsx
<Section title="Link-Level Performance">
  <DataTable
    rows={linkLevelRows}
    columns={[
      'link_id', 'url', 'sessions', 'conversions',
      'revenue', 'full_cost', 'profit', 'roi'
    ]}
  />
</Section>
```

---

## 3) URL-Level Performance (Aggregated from Link-Level)
Columns:
- `url`
- `total_links`
- `total_revenue`
- `total_cost`
- `profit`
- `roi`
- `cost_per_ftd`

Important:
- This section must consume URL aggregate endpoint built from `link_perf`.
- Do not recompute using raw attribution directly in UI.

### Suggested component tree
```tsx
<Section title="URL-Level Performance">
  <DataTable
    rows={urlLevelRows}
    columns={[
      'url', 'total_links', 'total_revenue',
      'total_cost', 'profit', 'roi', 'cost_per_ftd'
    ]}
  />
</Section>
```

---

## API Integration Contract
`GET /dashboard?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

```json
{
  "operations_summary": { "cost_per_lead": 42.17, "revenue_per_dollar": 2.6 },
  "link_level": [
    {
      "link_id": 101,
      "url": "https://example.com/page-a",
      "sessions": 1200,
      "conversions": 35,
      "revenue": 5400,
      "full_cost": 1200,
      "profit": 4200,
      "roi": 3.5
    }
  ],
  "url_level": [
    {
      "url": "https://example.com/page-a",
      "total_links": 4,
      "total_revenue": 18000,
      "total_cost": 5500,
      "profit": 12500,
      "roi": 2.2727,
      "cost_per_ftd": 61.11
    }
  ]
}
```
