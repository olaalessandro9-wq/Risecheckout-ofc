# Data Retention System

> **RISE Protocol V3 Compliant** - Centralized data cleanup with modular architecture

## Overview

The Data Retention System provides automated, centralized cleanup of temporary and expired data across 17 database tables. It ensures LGPD/GDPR compliance while maintaining system performance.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    pg_cron (Scheduler)                       │
│  - daily-data-cleanup: 03:00 UTC                            │
│  - hourly-oauth-cleanup: Every hour                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              cleanup_all_data_v2_with_log()                  │
│                   (Orchestrator + Logger)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  cleanup_all_data_v2()                       │
│               (Unified Cleanup Orchestrator)                 │
└─────────────────────────────────────────────────────────────┘
           │              │              │              │
           ▼              ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │  OAuth   │   │ Sessions │   │ Security │   │   GDPR   │
    │ Category │   │ Category │   │ Category │   │ Category │
    └──────────┘   └──────────┘   └──────────┘   └──────────┘
           │              │              │              │
           ▼              ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ cleanup_ │   │ cleanup_ │   │ cleanup_ │   │ cleanup_ │
    │ oauth_   │   │ expired_ │   │ vault_   │   │ gdpr_    │
    │ states() │   │ sessions │   │ access   │   │ requests │
    └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

## Retention Policies

| Table | Category | Retention | Criteria |
|-------|----------|-----------|----------|
| `oauth_states` | oauth | 1 hour | Expired or used tokens |
| `producer_sessions` | sessions | 7 days after expiry | Expired sessions |
| `buyer_sessions` | sessions | 7 days after expiry | Expired sessions |
| `vault_access_log` | security | 90 days | Old audit logs |
| `key_rotation_log` | security | 365 days | Old rotation logs |
| `encryption_key_versions` | security | Keep last 3 | Revoked/deprecated keys |
| `security_events` | security | 90 days | Old security events |
| `gdpr_requests` | gdpr | 90 days after processing | Completed/rejected requests |
| `gdpr_audit_log` | gdpr | 365 days | Old GDPR audit logs |
| `rate_limit_attempts` | rate_limit | 24 hours | Old rate limit entries |
| `buyer_rate_limits` | rate_limit | 24 hours | Expired blocks |
| `trigger_debug_logs` | legacy | 7 days | Debug logs |
| `security_audit_log` | legacy | 90 days | Old audit logs |
| `checkout_visits` | legacy | 365 days | Old visit analytics |
| `webhook_deliveries` | legacy | 30/90 days | Success/failed deliveries |
| `gateway_webhook_dlq` | legacy | 90 days | Resolved/abandoned entries |
| `order_events` | legacy | 180 days | Old order events |

## Edge Function API

**Endpoint:** `data-retention-executor`

### Actions

#### 1. Run Full Cleanup
```json
POST /data-retention-executor
{
  "action": "run-all"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-01-19T21:15:00.000Z",
  "action": "run-all",
  "total_rows_deleted": 1234,
  "duration_ms": 456,
  "results": [
    { "category": "oauth", "table_name": "oauth_states", "rows_deleted": 5 },
    { "category": "sessions", "table_name": "producer_sessions", "rows_deleted": 12 }
  ],
  "errors": []
}
```

#### 2. Run Category Cleanup
```json
POST /data-retention-executor
{
  "action": "run-category",
  "category": "sessions"
}
```

Valid categories: `oauth`, `sessions`, `security`, `gdpr`, `rate_limit`, `legacy`

#### 3. Dry Run (Preview)
```json
POST /data-retention-executor
{
  "action": "dry-run"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-01-19T21:15:00.000Z",
  "action": "dry-run",
  "total_rows_pending": 567,
  "results": [
    { "category": "oauth", "table_name": "oauth_states", "rows_to_delete": 3 },
    { "category": "sessions", "table_name": "producer_sessions", "rows_to_delete": 8 }
  ]
}
```

#### 4. Get Status
```json
POST /data-retention-executor
{
  "action": "status"
}
```

Returns all retention policies and available categories.

## SQL Functions

### Individual Cleanup Functions
Each table has its own cleanup function following Single Responsibility:

- `cleanup_oauth_states()` → BIGINT
- `cleanup_vault_access_log()` → BIGINT
- `cleanup_key_rotation_log()` → BIGINT
- `cleanup_old_encryption_keys()` → BIGINT
- `cleanup_expired_producer_sessions()` → BIGINT
- `cleanup_expired_buyer_sessions()` → BIGINT
- `cleanup_gdpr_requests()` → BIGINT
- `cleanup_gdpr_audit_log()` → BIGINT
- `cleanup_rate_limit_attempts()` → BIGINT
- `cleanup_security_events()` → BIGINT
- `cleanup_buyer_rate_limits()` → BIGINT

### Orchestrator Functions
- `cleanup_all_data_v2()` → TABLE(category, table_name, rows_deleted)
- `cleanup_all_data_v2_with_log()` → VOID (runs cleanup + logs to data_retention_log)
- `cleanup_by_category(p_category TEXT)` → TABLE(table_name, rows_deleted)
- `cleanup_dry_run()` → TABLE(category, table_name, rows_to_delete)

## Logging

All executions are logged to `data_retention_log` with:
- Timestamp
- Rows deleted per table
- Total execution time
- Cleanup version

Query recent logs:
```sql
SELECT * FROM data_retention_log 
ORDER BY executed_at DESC 
LIMIT 10;
```

## Cron Jobs

### Daily Full Cleanup (03:00 UTC)
```sql
SELECT cron.schedule(
  'daily-data-cleanup',
  '0 3 * * *',
  $$SELECT cleanup_all_data_v2_with_log()$$
);
```

### Hourly OAuth Cleanup
```sql
SELECT cron.schedule(
  'hourly-oauth-cleanup',
  '0 * * * *',
  $$SELECT cleanup_oauth_states()$$
);
```

## Adding New Tables

To add a new table to the retention system:

1. **Create cleanup function:**
```sql
CREATE OR REPLACE FUNCTION public.cleanup_new_table()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count BIGINT := 0;
BEGIN
  DELETE FROM new_table WHERE created_at < NOW() - INTERVAL 'X days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_new_table() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_new_table() TO service_role;
```

2. **Add to orchestrator** (update `cleanup_all_data_v2`)
3. **Add column to log table** (ALTER TABLE data_retention_log)
4. **Update types.ts** (add to RETENTION_POLICIES)

## Security

All cleanup functions use:
- `SECURITY DEFINER` - Runs with elevated privileges
- `SET search_path = public` - Prevents search path injection
- `REVOKE ALL FROM PUBLIC` - No public access
- `GRANT TO service_role` - Only service_role can execute

## RISE Protocol V3 Compliance

| Requirement | Status |
|-------------|--------|
| 300-line limit per file | ✅ (max: ~100 lines) |
| Zero unjustified `any` | ✅ (3 justified for RPC) |
| Single Responsibility | ✅ (1 function = 1 table) |
| SECURITY DEFINER + search_path | ✅ |
| service_role only | ✅ |
| Documentation | ✅ |
