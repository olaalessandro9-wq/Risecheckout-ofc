# Data Retention System

> **RISE Protocol V3 Compliant** - Centralized data cleanup with modular architecture

## Overview

The Data Retention System provides automated, centralized cleanup of temporary and expired data across database tables. It ensures LGPD/GDPR compliance while maintaining system performance.

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
```

## Retention Policies

| Table | Category | Retention | Criteria |
|-------|----------|-----------|----------|
| `oauth_states` | oauth | 1 hour | Expired or used tokens |
| `sessions` | sessions | 7 days after expiry | Expired sessions (RISE V3 unified) |
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

#### 4. Get Status
```json
POST /data-retention-executor
{
  "action": "status"
}
```

## SQL Functions

### Individual Cleanup Functions
Each table has its own cleanup function following Single Responsibility:

- `cleanup_oauth_states()` → BIGINT
- `cleanup_vault_access_log()` → BIGINT
- `cleanup_key_rotation_log()` → BIGINT
- `cleanup_old_encryption_keys()` → BIGINT
- `cleanup_expired_sessions()` → BIGINT (RISE V3 unified)
- `cleanup_gdpr_requests()` → BIGINT
- `cleanup_gdpr_audit_log()` → BIGINT
- `cleanup_rate_limit_attempts()` → BIGINT
- `cleanup_security_events()` → BIGINT
- `cleanup_buyer_rate_limits()` → BIGINT

## Security

All cleanup functions use:
- `SECURITY DEFINER` - Runs with elevated privileges
- `SET search_path = public` - Prevents search path injection
- `REVOKE ALL FROM PUBLIC` - No public access
- `GRANT TO service_role` - Only service_role can execute

## RISE Protocol V3 Compliance

| Requirement | Status |
|-------------|--------|
| 300-line limit per file | ✅ |
| Zero unjustified `any` | ✅ |
| Single Responsibility | ✅ |
| Unified sessions table | ✅ |
| Documentation | ✅ |
