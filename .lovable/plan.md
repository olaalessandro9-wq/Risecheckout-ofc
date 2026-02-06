

# Migration: Legacy JWT API Keys to New Publishable/Secret API Keys

## Context

Supabase is deprecating the legacy JWT-based `anon` and `service_role` API keys. The new system uses:

- **Publishable key** (`sb_publishable_...`) -- replaces `anon` key (safe for frontend)
- **Secret key** (`sb_secret_...`) -- replaces `service_role` key (backend only)

Late 2026 (TBC), legacy keys will be **deleted** and apps still using them will **break**. Migrating now eliminates this ticking time bomb of technical debt.

## Current State Analysis

### Frontend
| Component | Current State | Uses Legacy Key? |
|-----------|-------------|-----------------|
| `src/integrations/supabase/client.ts` | Hardcoded legacy JWT | Yes (but DEAD CODE -- no file imports `supabase` from it) |
| `src/config/supabase.ts` | `API_GATEWAY_URL` only, no keys | No |
| `src/config/env.ts` | `supabaseAnonKey` from `VITE_SUPABASE_ANON_KEY` | Yes (but DEAD CODE -- not imported anywhere) |
| `src/lib/api/public-client.ts` | Calls API Gateway, no keys | No |
| `src/lib/api/*.ts` | Calls API Gateway, no keys | No |

**Conclusion:** The RISE API Gateway architecture already eliminated keys from the active frontend. The legacy references are dead code.

### Cloudflare Worker (API Gateway)
| Secret | Current Value | Needs Update |
|--------|--------------|-------------|
| `SUPABASE_ANON_KEY` | Legacy JWT anon key | YES -- must become publishable key |

### Backend (Edge Functions)
| Component | Current State | Impact |
|-----------|-------------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` env var | Used by 100+ functions | AUTO-UPDATED by Supabase platform |
| `SUPABASE_ANON_KEY` env var | Referenced in `check-secrets`, tests | AUTO-UPDATED by Supabase platform |
| `config.toml` | Only 1 function has `verify_jwt = false` | CRITICAL -- must add ALL 105 functions |
| `getSupabaseClient()` factory | Only 1 function uses it | No code change needed |

### Documentation
| File | Has Legacy References | Needs Update |
|------|---------------------|-------------|
| `docs/API_GATEWAY_ARCHITECTURE.md` | `SUPABASE_ANON_KEY` | YES |
| `docs/EDGE_FUNCTIONS_REGISTRY.md` | Badge, metrics | YES |
| `docs/SECURITY_OVERVIEW.md` | Anon key references | YES |
| `.env.example` | `VITE_SUPABASE_ANON_KEY` | YES |
| `check-secrets/index.ts` | `SUPABASE_ANON_KEY` | YES |

---

## Critical Technical Detail: `verify_jwt` and New Keys

New publishable/secret keys are NOT JWTs. They are opaque tokens (`sb_publishable_...`, `sb_secret_...`). The Supabase API Gateway resolves them into temporary short-lived JWTs internally.

When `verify_jwt = true` (the default), the Supabase platform attempts JWT verification on the `apikey` header BEFORE the edge function code runs. With new keys, this verification **fails** because the key is not a JWT.

Therefore, `verify_jwt = false` must be set for ALL functions BEFORE disabling legacy keys. The RISE architecture already does auth in code (cookies + sessions table via `unified-auth-v2.ts`), so platform-level JWT verification is redundant.

Currently `supabase/config.toml` only lists 1 function. The other 104 functions use the default `verify_jwt = true`. This is a pre-existing inconsistency (the EDGE_FUNCTIONS_REGISTRY claims all functions have `verify_jwt = false`).

---

## Solution Analysis

### Solution A: Minimal -- Only update keys, fix config.toml
- Manutenibilidade: 6/10 -- Dead code remains, docs outdated
- Zero DT: 5/10 -- Legacy references create confusion
- Arquitetura: 6/10 -- Inconsistent naming across codebase
- Escalabilidade: 8/10 -- Keys work but docs mislead future devs
- Seguranca: 9/10 -- New keys are more secure
- **NOTA FINAL: 6.5/10**
- Tempo estimado: 15 minutos

### Solution B: Complete migration with dead code removal, doc updates, and naming normalization
- Manutenibilidade: 10/10 -- Zero legacy references, all docs current, naming consistent
- Zero DT: 10/10 -- No dead code, no outdated docs, no legacy naming
- Arquitetura: 10/10 -- config.toml covers all functions, docs match reality
- Escalabilidade: 10/10 -- Future devs see only the new system
- Seguranca: 10/10 -- New keys + all legacy references purged
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 30-45 minutos

### DECISION: Solution B (Nota 10.0)

Solution A leaves dead code and outdated documentation, which will confuse future development and creates a false impression that legacy keys are still in use. Solution B ensures zero traces of the legacy system remain in the codebase.

---

## Execution Plan

### Phase 1: Code Preparation (Lovable -- what I implement)

#### 1.1 `supabase/config.toml` -- Add ALL 105 functions with `verify_jwt = false`

This is the most critical change. Every edge function must have its entry. Format:

```text
project_id = "wivbtmtgpsxupfjwwovf"

[functions.admin-data]
verify_jwt = false

[functions.admin-health]
verify_jwt = false

... (all 105 functions)
```

Functions to include (from `supabase/functions/` directory listing):
admin-data, admin-health, affiliate-pixel-management, affiliation-public, alert-stuck-orders, asaas-create-payment, asaas-validate-credentials, asaas-webhook, buyer-orders, buyer-profile, check-secrets, checkout-crud, checkout-editor, checkout-heartbeat, checkout-public-data, content-crud, content-library, content-save, coupon-management, coupon-read, create-order, dashboard-analytics, data-retention-executor, decrypt-customer-data, decrypt-customer-data-batch, detect-abandoned-checkouts, email-preview, encrypt-token, facebook-conversion-api, gdpr-forget, gdpr-request, get-affiliation-details, get-affiliation-status, get-all-affiliation-statuses, get-my-affiliations, get-order-for-pix, get-pix-status, grant-member-access, health, integration-management, key-rotation-executor, manage-affiliation, manage-user-role, manage-user-status, marketplace-public, members-area-certificates, members-area-drip, members-area-groups, members-area-modules, members-area-progress, members-area-quizzes, mercadopago-create-payment, mercadopago-oauth-callback, mercadopago-webhook, offer-bulk, offer-crud, order-bump-crud, order-lifecycle-worker, owner-settings, pixel-management, process-webhook-queue, producer-profile, product-crud, product-duplicate, product-entities, product-full-loader, product-settings, products-crud, pushinpay-create-pix, pushinpay-get-status, pushinpay-stats, pushinpay-validate-token, pushinpay-webhook, reconcile-asaas, reconcile-mercadopago, reconcile-pending-orders, request-affiliation, retry-webhooks, rls-documentation-generator, rls-security-tester, rpc-proxy, security-management, send-confirmation-email, send-email, send-pix-email, send-webhook-test, session-manager, smoke-test, storage-management, stripe-connect-oauth, stripe-create-payment, stripe-webhook, students-access, students-groups, students-invite, students-list, test-deploy, track-visit, trigger-webhooks, unified-auth, update-affiliate-settings, utmify-conversion, utmify-validate-credentials, vault-save, vendor-integrations, verify-turnstile, webhook-crud

#### 1.2 `src/config/env.ts` -- Remove dead Supabase config

The `supabaseAnonKey`, `supabaseUrl`, and `isSupabaseConfigured()` are dead code (no file imports them). Remove the entire "SUPABASE CONFIG" section. The RISE architecture uses `src/config/supabase.ts` exclusively.

#### 1.3 `src/config/supabase.ts` -- Update documentation

Update JSDoc to reference new API key system instead of "anon key".

#### 1.4 `check-secrets/index.ts` -- Update key name references

Change `'SUPABASE_ANON_KEY': 'supabase'` to document the new naming convention. The env var NAME stays the same (Supabase platform auto-updates the value), but the documentation should clarify what it actually contains now.

#### 1.5 `check-secrets/tests/_shared.ts` -- Update test fixtures

Same update as the main function.

#### 1.6 `_shared/testing/test-config.ts` -- Update variable naming

Rename `supabaseAnonKey` to `supabasePublishableKey` for clarity in test config.

#### 1.7 `supabase/functions/run-tests.sh` -- Update variable references

Update SUPABASE_ANON_KEY references to match new naming.

#### 1.8 `docs/API_GATEWAY_ARCHITECTURE.md` -- Full update

- Change "SUPABASE_ANON_KEY" to "SUPABASE_PUBLISHABLE_KEY" in Cloudflare Worker secrets table
- Update "Rotacionando apikey" section
- Add migration notes

#### 1.9 `.env.example` -- Update key names

Replace `VITE_SUPABASE_ANON_KEY` references with notes about new publishable key system.

#### 1.10 `docs/RLS_DOCUMENTATION_GENERATOR.md` -- Update auth header examples

Replace `YOUR_ANON_KEY` with appropriate new key references.

#### 1.11 `tests/test-storage-ownership.sh` -- Update script references

Update `ANON_KEY` / `anon_key` variables to use publishable key naming.

### Phase 2: External Changes (User does manually)

These steps must be done IN ORDER after Phase 1 code is deployed:

#### Step 1: Verify new keys exist
Go to Supabase Dashboard > Settings > API Keys > "Publishable and secret API keys" tab.
Confirm you see a publishable key starting with `sb_publishable_...` and a secret key starting with `sb_secret_...`.

#### Step 2: Update Cloudflare Worker secret
In Cloudflare Dashboard (or via Wrangler CLI):
1. Update the Worker secret from `SUPABASE_ANON_KEY` (legacy JWT value) to the new publishable key value (`sb_publishable_...`)
2. Consider renaming the secret to `SUPABASE_PUBLISHABLE_KEY` for clarity
3. Deploy the Worker

#### Step 3: Test the system
- Test a public checkout flow (PIX + Card)
- Test authenticated producer flows (login, product CRUD)
- Test buyer auth (login, member area access)
- Verify all edge functions respond correctly

#### Step 4: Disable legacy keys
Only after confirming everything works:
1. Supabase Dashboard > Settings > API Keys > "Legacy anon, service_role API keys" tab
2. Click "Disable JWT-based API keys"
3. Test again to confirm nothing breaks

#### Step 5: Final validation
- Run `smoke-test` edge function
- Run `health` edge function
- Verify dashboard analytics loads
- Verify webhook processing (PushinPay, MercadoPago, Stripe)

---

## File Tree

```text
MODIFIED:
  supabase/config.toml                          <- ALL 105 functions with verify_jwt = false
  src/config/env.ts                             <- Remove dead Supabase config section
  src/config/supabase.ts                        <- Update JSDoc for new key system
  supabase/functions/check-secrets/index.ts     <- Update key naming/docs
  supabase/functions/check-secrets/tests/_shared.ts <- Update test fixtures
  supabase/functions/_shared/testing/test-config.ts <- Rename variable
  supabase/functions/run-tests.sh               <- Update variable naming
  docs/API_GATEWAY_ARCHITECTURE.md              <- Full update for new key system
  .env.example                                  <- Update key references
  docs/RLS_DOCUMENTATION_GENERATOR.md           <- Update auth examples
  tests/test-storage-ownership.sh               <- Update key variables
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Edge functions fail after disabling legacy keys | LOW | HIGH | `verify_jwt = false` deployed BEFORE disabling legacy keys |
| Cloudflare Worker breaks | LOW | HIGH | Update Worker secret BEFORE disabling legacy keys |
| Some test scripts fail | MEDIUM | LOW | Update all scripts in Phase 1 |
| Supabase platform env vars not auto-updated | VERY LOW | HIGH | Supabase docs confirm auto-update behavior |

## Rollback Plan

If anything breaks after disabling legacy keys:
1. Supabase Dashboard > API Keys > Legacy tab > Re-enable legacy keys
2. Revert Cloudflare Worker secret to legacy anon key value
3. System immediately functional again

Legacy keys can be re-enabled at any time until they are permanently removed by Supabase (late 2026).

