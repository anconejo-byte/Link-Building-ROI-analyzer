-- Mock data for manual/automated testing
-- Compatible with sql/schema.sql

INSERT INTO operations_period (period_id, period_name, period_start, period_end, labor_cost, tools_cost, overhead_cost, lead_count)
VALUES
  (1, '2026-01 Outreach', '2026-01-01', '2026-01-31', 4200, 800, 1000, 180),
  (2, '2026-02 Outreach', '2026-02-01', '2026-02-28', 4600, 850, 1100, 210);

INSERT INTO urls (url_id, canonical_url, campaign_name)
VALUES
  (1, 'https://brand.example/casino-bonus', 'Casino SEO'),
  (2, 'https://brand.example/sportsbook-guide', 'Sportsbook SEO'),
  (3, 'https://brand.example/poker-app', 'Poker SEO');

INSERT INTO links (link_id, url_id, period_id, source_domain, placement_date, direct_link_cost, sessions, allocation_weight)
VALUES
  (1, 1, 1, 'news-a.com', '2026-01-05', 260, 980, 1.2),
  (2, 1, 1, 'review-hub.com', '2026-01-14', 320, 1240, 1.0),
  (3, 2, 1, 'bet-tips.net', '2026-01-21', 210, 760, 0.8),
  (4, 2, 2, 'sportsdata.blog', '2026-02-07', 400, 1600, 1.5),
  (5, 3, 2, 'poker-insights.io', '2026-02-13', 230, 820, 1.0),
  (6, 3, 2, 'affiliate-world.org', '2026-02-24', 340, 1100, 1.3);

INSERT INTO link_attribution (link_id, conversion_event_id, conversion_date, conversions, revenue, first_time_deposit_count, attribution_weight)
VALUES
  (1, 'evt_1001', '2026-01-10', 6, 850, 3, 1.0),
  (1, 'evt_1002', '2026-01-18', 4, 540, 2, 1.0),
  (2, 'evt_1003', '2026-01-22', 8, 1200, 4, 1.0),
  (3, 'evt_1004', '2026-01-27', 5, 610, 2, 1.0),
  (4, 'evt_1005', '2026-02-10', 11, 1800, 6, 1.0),
  (5, 'evt_1006', '2026-02-16', 7, 970, 3, 1.0),
  (6, 'evt_1007', '2026-02-25', 9, 1410, 5, 1.0),
  (4, 'evt_1008', '2026-02-27', 3, 420, 1, 1.0);
