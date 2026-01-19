-- ============================================================================
-- RISE Protocol V3 - Update pg_cron Jobs for Data Retention V2
-- ============================================================================
-- Updates:
-- 1. Remove old daily-data-cleanup job (uses cleanup_old_data_with_log)
-- 2. Create new daily-data-cleanup-v2 (uses cleanup_all_data_v2_with_log - 16 tables)
-- 3. Create hourly-oauth-cleanup (uses cleanup_oauth_states)
-- ============================================================================

-- Remove old cron job by jobid
SELECT cron.unschedule(1);

-- Create new unified data cleanup job using v2 (covers 16 tables)
SELECT cron.schedule(
  'daily-data-cleanup-v2',
  '0 3 * * *', -- 03:00 daily
  $$SELECT cleanup_all_data_v2_with_log()$$
);

-- Create hourly oauth cleanup job (oauth_states expire quickly)
SELECT cron.schedule(
  'hourly-oauth-cleanup',
  '0 * * * *', -- Every hour at :00
  $$SELECT cleanup_oauth_states()$$
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After this migration, run:
-- SELECT jobid, jobname, schedule, command FROM cron.job ORDER BY jobid;
-- Expected: 2 jobs (daily-data-cleanup-v2, hourly-oauth-cleanup)
-- ============================================================================