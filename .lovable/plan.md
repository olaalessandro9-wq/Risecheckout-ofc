
# Fix: Coupon Not Applied to Orders (Dual-State Elimination)

## Root Cause

The coupon state exists in TWO places simultaneously:

```text
SharedOrderSummary
  useCouponValidation() --> LOCAL appliedCoupon (React useState)
    useEffect fires onTotalChange(total, localCoupon)
      handleTotalChange calls applyCoupon(coupon)
        XState sets context.appliedCoupon --> XSTATE appliedCoupon
          handleTotalChange recreates (dep: appliedCoupon)
            SharedOrderSummary useEffect re-fires (dep: onTotalChange)
              INFINITE LOOP --> React bails out --> coupon lost
```

The user sees R$5.00 because `SharedOrderSummary` renders from its LOCAL state. But the XState context (which drives `create-order` and payment gateways) never receives the coupon reliably.

**Database proof:** All orders have `coupon_code: null`, `amount_cents: 1000`. Coupon `uses_count: 0`.

## Solution Analysis

### Solution A: Eliminate Dual State -- XState as SOLE coupon owner

- Manutenibilidade: 10/10 -- Single state, zero sync logic
- Zero DT: 10/10 -- Removes the infinite loop root cause entirely
- Arquitetura: 10/10 -- XState is already the SSOT for all checkout state
- Escalabilidade: 10/10 -- Any new coupon feature touches only XState
- Seguranca: 10/10 -- Coupon always reaches backend
- **NOTA FINAL: 10.0/10**

### Solution B: Fix the useEffect deps to break the loop

- Manutenibilidade: 6/10 -- Dual state remains, sync logic is fragile
- Zero DT: 5/10 -- Another dep change could reintroduce the loop
- Arquitetura: 4/10 -- Violates SRP: two states for same data
- Escalabilidade: 5/10 -- Every new coupon feature must update both states
- Seguranca: 8/10 -- Might work but is inherently fragile
- **NOTA FINAL: 5.4/10**

### Solution C: Remove appliedCoupon from handleTotalChange deps using useRef

- Manutenibilidade: 7/10 -- Works but adds complexity (ref + callback pattern)
- Zero DT: 6/10 -- Dual state persists, just hides the loop
- Arquitetura: 5/10 -- useRef workaround masks architectural flaw
- Escalabilidade: 6/10 -- Two states still need manual sync
- Seguranca: 8/10 -- Functional but fragile
- **NOTA FINAL: 6.2/10**

### DECISION: Solution A (10.0/10)

Solutions B and C are patches on a fundamentally broken dual-state architecture. Solution A eliminates the problem at its root by making XState the single owner of coupon state. The coupon validation API call moves into an XState actor, and `SharedOrderSummary` reads coupon state from props instead of managing its own.

## Technical Changes

### File 1: `src/modules/checkout-public/components/CheckoutPublicContent.tsx`

**Remove `handleTotalChange` entirely.** Instead, pass `appliedCoupon` (from XState) and coupon action callbacks directly to `SharedOrderSummary` via `SharedCheckoutLayout`.

Changes:
- Remove `handleTotalChange` callback and its `onTotalChange` prop
- Add new props: `appliedCoupon`, `onApplyCoupon`, `onRemoveCoupon` forwarded to layout
- `onApplyCoupon` calls the XState `applyCoupon` action directly
- `onRemoveCoupon` calls the XState `removeCoupon` action directly

### File 2: `src/components/checkout/shared/SharedCheckoutLayout.tsx`

Add new props to forward coupon state and actions to `SharedOrderSummary`:
- `appliedCoupon: AppliedCoupon | null`
- `onApplyCoupon: (coupon: AppliedCoupon) => void`
- `onRemoveCoupon: () => void`

Remove `onTotalChange` prop entirely.

### File 3: `src/components/checkout/shared/SharedOrderSummary.tsx`

This is the critical change. Instead of owning coupon state locally via `useCouponValidation`, it receives coupon state and actions from props:

**Before (dual state):**
```text
SharedOrderSummary
  useCouponValidation() --> LOCAL state
  useEffect --> onTotalChange --> sync to XState (broken)
```

**After (single state):**
```text
SharedOrderSummary
  props.appliedCoupon --> from XState (SSOT)
  props.onApplyCoupon --> validates then syncs to XState
  props.onRemoveCoupon --> clears XState
  Internal: only couponCode input text + isValidating flag
```

Changes:
- Remove `useCouponValidation` hook import and usage
- Remove `onTotalChange` prop and the `useEffect` that called it
- Add props: `appliedCoupon`, `onApplyCoupon`, `onRemoveCoupon`
- Keep local state ONLY for: `couponCode` (input text), `isValidating` (loading flag)
- Inline the validation API call (or extract to a pure function)
- On successful validation: call `props.onApplyCoupon(couponData)` which goes directly to XState
- On remove: call `props.onRemoveCoupon()` which goes directly to XState
- All price calculations use `props.appliedCoupon` (from XState) instead of local state

### File 4: `src/modules/checkout-public/machines/checkoutPublicMachine.types.ts`

No changes needed. `CouponData` interface already matches `AppliedCoupon` structurally.

### File 5: `src/components/checkout/shared/CouponInput.tsx`

Likely needs minor prop adjustments to work with the new flow. The validation trigger and remove actions come from the parent instead of a local hook.

### Files NOT changed:
- `checkoutPublicMachine.ts` -- APPLY_COUPON/REMOVE_COUPON events already exist
- `checkoutPublicMachine.inputs.ts` -- `createOrderInput` already reads `context.appliedCoupon?.id`
- `coupon-processor.ts` (backend) -- Already correct, just never received the coupon_id
- `order-creator.ts` (backend) -- Already stores `coupon_id` and `coupon_code`

## Data Flow After Fix

```text
User types coupon code in SharedOrderSummary
  --> clicks "Aplicar"
  --> SharedOrderSummary calls API (validate-coupon) directly
  --> On success: calls props.onApplyCoupon(couponData)
    --> CheckoutPublicContent.applyCoupon(couponData)
      --> XState: APPLY_COUPON --> context.appliedCoupon = couponData
        --> React re-renders
          --> SharedOrderSummary receives props.appliedCoupon (non-null)
          --> Calculates discounted price from props.appliedCoupon
          --> Displays R$5.00

User clicks "Comprar"
  --> XState: SUBMIT
    --> createOrderInput(context) reads context.appliedCoupon.id = "7c86ac89..."
    --> Sends coupon_id to create-order backend
    --> Backend processCoupon validates and applies 50% discount
    --> Order created with amount_cents: 500, coupon_code: "10ZAO"
    --> Payment gateway receives 500 cents (R$5.00)
```

Zero feedback loops. Zero dual state. Zero sync issues. The coupon flows in ONE direction: XState context to UI via props.

## Builder/Preview Compatibility

The `SharedOrderSummary` is also used in the Builder (editor/preview modes). For those modes, the new coupon props can be optional. When not provided (editor/preview), the component can use a local `useCouponValidation` hook as fallback, since those modes don't create real orders. This maintains backward compatibility without affecting the public checkout fix.

## Verification Checklist

After implementation:
- Coupon "10ZAO" applied --> `context.appliedCoupon.id` is UUID in XState
- Order created with `coupon_code: "10ZAO"` and `amount_cents: 500`
- PIX generated for R$5.00 (500 cents)
- Card payment charged R$5.00
- Dashboard shows R$5.00
- UTMify receives R$5.00
- Coupon `uses_count` incremented to 1
