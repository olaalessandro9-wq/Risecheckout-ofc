# ULTRA TRACKING — Implementation Status

## Status: ✅ COMPLETE (100%)

All 15 layers of the Ultra Tracking pipeline have been audited and verified.

---

## Architecture Overview

The Ultra Tracking system maximizes Facebook Event Match Quality (EMQ 8.0+/10) via a hybrid
Browser Pixel + Server-side CAPI architecture with full user identity enrichment.

### Data Flow

```
[Checkout Form] → email, phone, name
[Browser Cookies] → _fbc, _fbp
[Browser Metadata] → user_agent, page_url

  ↓ Frontend (Pixel.tsx)
  fbq("init", pixelId, userData)  ← Advanced Matching (Phase 2, one-time)

  ↓ Frontend (createOrderActor.ts)
  POST /create-order { ...orderData, fbp, fbc, customer_user_agent, event_source_url }

  ↓ Backend (create-order)
  INSERT INTO orders (..., fbp, fbc, customer_user_agent, event_source_url)

  ↓ Backend (facebook-conversion-api via dispatcher.ts)
  POST graph.facebook.com/v21.0/{pixel_id}/events
  user_data: { em, ph, fn, ln, external_id, fbc, fbp, client_ip_address, client_user_agent }
  event_source_url: <checkout page URL>
```

### Key Components

| Layer | File | Status |
|-------|------|--------|
| DB Columns | `orders.fbp`, `orders.fbc`, `orders.customer_user_agent`, `orders.event_source_url` | ✅ |
| Cookie Reader | `src/lib/tracking/facebook-cookies.ts` | ✅ |
| Order Actor | `src/modules/checkout-public/machines/actors/createOrderActor.ts` | ✅ |
| Validators | `supabase/functions/_shared/validators.ts` | ✅ |
| Create Order | `supabase/functions/create-order/index.ts` | ✅ |
| Order Creator | `supabase/functions/create-order/handlers/order-creator.ts` | ✅ |
| CAPI Types | `supabase/functions/_shared/facebook-capi/types.ts` | ✅ |
| CAPI Dispatcher | `supabase/functions/_shared/facebook-capi/dispatcher.ts` | ✅ |
| CAPI Function | `supabase/functions/facebook-conversion-api/index.ts` | ✅ |
| Pixel (AM) | `src/integrations/tracking/facebook/Pixel.tsx` | ✅ |
| TrackingManager | `src/components/checkout/v2/TrackingManager.tsx` | ✅ |
| CheckoutContent | `src/modules/checkout-public/components/CheckoutPublicContent.tsx` | ✅ |
| CSP Headers | `vercel.json` (connect-src) | ✅ |
| Barrel Exports | `src/integrations/tracking/facebook/index.ts` | ✅ |
| Registry | `docs/EDGE_FUNCTIONS_REGISTRY.md` | ✅ |

### Design Decisions

- **No address fields** (CEP/city/state) in the checkout form to preserve conversion rate.
- **Two-phase Pixel init**: Phase 1 loads script + basic init; Phase 2 re-inits with Advanced Matching once a valid email is detected (single transition, no keystroke churn).
- **Email validation gate**: `advancedMatching` object is only built when email contains `@` and a domain with `.`, preventing unnecessary re-renders.
- **Retry queue**: Failed CAPI events go to `failed_facebook_events` table with exponential backoff (3 retries) for 0% data loss.
