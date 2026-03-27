# Link-Building Profitability System

This implementation provides:
- **Data model** for `operations_period`, `links`, `urls`, `link_attribution`
- **Calculations** for CPL, conversion rate, cost/link variants, revenue/link, profit, ROI
- **URL-level rollups** generated from link-level derived data
- **Date-range filtering** for all report sections
- **Weighted cost allocation** via `allocation_weight`
- **Frontend reporting layer** where users can input operational/link/attribution data and recalculate all dashboard outputs

## Files
- `sql/schema.sql`: Tables, constraints, and anti-double-counting uniqueness.
- `backend/app.py`: Backend query logic and `/dashboard` API contract.
- `ui/dashboard_layout.md`: 3-section dashboard wireframe and integration contract.
- `ui/reporting_app.html`: User input + reporting UI.
- `ui/reporting_app.js`: Frontend calculation engine and aggregation logic.
- `ui/reporting_app.css`: Styles for the reporting app.
- `sql/mock_data.sql`: SQL seed data for test/demo runs.

## No Double Counting
- DB level: `link_attribution.conversion_event_id` is unique.
- Frontend level: duplicate `conversion_event_id` is blocked at input time.

## Query Pattern
All reporting sections use a shared `link_perf` logic:
1. Filters links by date range.
2. Allocates period operational cost to links (weighted or fallback equal split).
3. Aggregates attributed conversions/revenue per link.

Then:
- Operations summary aggregates `link_perf`
- Link table shows per-link metrics
- URL table aggregates link rows

## Run Frontend
Open `ui/reporting_app.html` in a browser (or serve with any static file server) and enter:
1. Operations periods
2. URLs
3. Links
4. Link attribution rows

Then apply date range and click **Recalculate Dashboard**.

To quickly test, click **Load Mock Data** in the UI.

## Seed Database Quickly
Load schema + mock data:

1. Run `sql/schema.sql`
2. Run `sql/mock_data.sql`
