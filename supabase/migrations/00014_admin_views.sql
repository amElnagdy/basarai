-- ========================================
-- Admin Monitoring Views
-- ========================================

CREATE VIEW admin_stats AS
SELECT
  (SELECT count(*) FROM profiles) AS total_accounts,
  (SELECT count(*) FROM brands) AS total_brands,
  (SELECT count(*) FROM generations) AS total_generations,
  (SELECT count(*) FROM generations WHERE status = 'pending') AS generations_pending,
  (SELECT count(*) FROM generations WHERE status = 'processing') AS generations_processing,
  (SELECT count(*) FROM generations WHERE status = 'succeeded') AS generations_succeeded,
  (SELECT count(*) FROM generations WHERE status = 'failed') AS generations_failed,
  (SELECT count(*) FROM generations WHERE provider = 'openai') AS generations_openai,
  (SELECT count(*) FROM generations WHERE provider = 'gemini') AS generations_gemini,
  (SELECT count(*) FROM generations WHERE created_at >= now() - interval '7 days') AS generations_last_7d,
  (SELECT count(*) FROM generations WHERE created_at >= now() - interval '30 days') AS generations_last_30d,
  (SELECT count(*) FROM brand_kits WHERE status = 'complete') AS brand_kits_complete,
  (SELECT count(*) FROM provider_keys WHERE is_active) AS active_provider_keys;

CREATE VIEW admin_brand_overview AS
SELECT
  b.id,
  b.name,
  b.owner_user_id,
  p.full_name AS owner_full_name,
  COALESCE(bk.status::text, 'not_started') AS kit_status,
  (SELECT count(*) FROM generations g WHERE g.brand_id = b.id) AS generation_count,
  EXISTS (
    SELECT 1
    FROM provider_keys pk
    WHERE pk.brand_id = b.id
      AND pk.is_active
  ) AS has_active_key,
  b.created_at
FROM brands b
LEFT JOIN profiles p ON p.user_id = b.owner_user_id
LEFT JOIN brand_kits bk ON bk.brand_id = b.id;

COMMENT ON VIEW admin_stats IS 'Single-row system-wide aggregate for the admin monitoring dashboard';
COMMENT ON VIEW admin_brand_overview IS 'Per-brand read-only overview for the admin monitoring dashboard';

REVOKE ALL ON admin_stats, admin_brand_overview FROM anon, authenticated;
GRANT SELECT ON admin_stats, admin_brand_overview TO service_role;
