# Link-Building Profitability System

This implementation provides:
- **Data model** for `operations_period`, `links`, `urls`, `link_attribution`
- **Calculations** for CPL, conversion rate, cost/link variants, revenue/link, profit, ROI
- **URL-level rollups** generated from link-level derived data
- **Date-range filtering** for all report sections
- **Weighted cost allocation** via `allocation_weight`
- **Frontend reporting layer** with CSV link import, report save, and PDF export

## Files
- `sql/schema.sql`: Tables, constraints, and anti-double-counting uniqueness.
- `backend/app.py`: Backend query logic and `/dashboard` API contract.
- `ui/reporting_app.html`: User-facing reporting UI.
- `ui/reporting_app.js`: Frontend calculation engine and aggregation logic.
- `ui/reporting_app.css`: Styles for the reporting app.
- `ui/mock_links.csv`: Mock CSV file for link import testing.
- `sql/mock_data.sql`: SQL seed data for DB test/demo runs.

## Updated UI Behavior
- Removed manual URL input form.
- Link input supports both:
  - manual link entry (primary)
  - CSV upload (secondary)
  with required columns:
  `link_id,landing_page,backlink_url,backlink_ftds_amount,backlinks_deposits_amount,backlink_cost,landing_page_ftds_amount,landing_page_ftds_deposits,placement_date,period_id,sessions,allocation_weight`
- Operations form uses:
  - salary per link builder
  - total number of link builders
  - tools cost
  (no overhead field)
- Operations summary is rendered as cards for better readability.
- Link-level report includes backlink URL and money brought.
- URL-level report shows URL generation vs link costs (no cost_per_ftd).
- Save current report snapshot in browser storage and reload it later.
- Export current view to PDF using browser print flow.

## Run Frontend
1. Open `ui/reporting_app.html` in a browser.
2. Add operations period rows.
3. Add links manually and/or upload `ui/mock_links.csv` (or your own CSV with required columns).
4. Pick date range and click **Recalculate Dashboard**.
5. Optionally click **Save Current Report** and **Export as PDF**.

## Seed Database Quickly
Load schema + mock data:
1. Run `sql/schema.sql`
2. Run `sql/mock_data.sql`
