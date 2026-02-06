
# Dual-Layout System for Checkout Builder

## Current Problem

The checkout builder has Desktop/Mobile toggle buttons but they only change the **preview width**. Both viewports edit the **same** `topComponents` and `bottomComponents`. There is no way to have different components for desktop vs mobile.

## Reference Architecture

The Members Area Builder already implements this pattern correctly with XState:
- `desktopSections` / `mobileSections` separate arrays
- `activeViewport` controls which is being edited
- `isMobileSynced` flag for auto-sync mode
- Save/Load handles both arrays, separated by viewport

## Solution Analysis

### Solution A: Replicate Members Area Builder pattern with XState State Machine

Migrate `useCheckoutEditor` from `useState` to an XState state machine mirroring the Members Area Builder architecture. Dual `desktopCustomization` / `mobileCustomization` with full state machine lifecycle (idle, loading, ready.pristine, ready.dirty, saving).

- Manutenibility: 10/10 (consistent with Members Area Builder, single pattern across project)
- Zero DT: 10/10 (XState provides deterministic state transitions, no race conditions)
- Architecture: 10/10 (follows existing proven pattern, SOLID principles)
- Scalability: 10/10 (adding new viewports like tablet would be trivial)
- Security: 10/10 (no changes to security model)
- **FINAL SCORE: 10.0/10**

### Solution B: Keep useState, add separate state for mobile components

Add `mobileTopComponents` / `mobileBottomComponents` useState hooks alongside existing ones. Use `viewMode` to switch which are passed to the renderer.

- Manutenibility: 6/10 (grows the hook with more scattered useState, inconsistent with builder pattern)
- Zero DT: 5/10 (no dirty tracking, no sync mode, duplicated logic for every action)
- Architecture: 4/10 (diverges from Members Area Builder, violates consistency principle)
- Scalability: 5/10 (adding viewports would require exponential useState additions)
- Security: 10/10
- **FINAL SCORE: 5.6/10**

### Solution C: Single customization object with viewport-keyed components

Store `{ desktop: { top, bottom }, mobile: { top, bottom } }` in a single state object using useState.

- Manutenibility: 7/10 (cleaner than B but lacks state machine benefits)
- Zero DT: 7/10 (no formal dirty tracking or discard mechanism)
- Architecture: 6/10 (still inconsistent with Members Area Builder's XState pattern)
- Scalability: 7/10
- Security: 10/10
- **FINAL SCORE: 7.0/10**

### DECISION: Solution A (Score 10.0)

Solutions B and C create architectural inconsistency with the Members Area Builder. Solution A uses the same proven XState pattern, providing deterministic state management, dirty tracking, and a consistent developer experience across both builders.

---

## Execution Plan

### Phase 1: Database Schema (New Columns)

**Migration SQL** - Add `mobile_top_components` and `mobile_bottom_components` columns to the `checkouts` table:

```sql
ALTER TABLE public.checkouts
  ADD COLUMN mobile_top_components jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN mobile_bottom_components jsonb DEFAULT '[]'::jsonb;
```

This preserves backward compatibility: existing checkouts have empty mobile arrays, which the builder interprets as "mobile synced with desktop" (same pattern as Members Area Builder).

### Phase 2: Types (Dual-Layout Support)

**File: `src/types/checkoutEditor.ts`** - Expand `CheckoutCustomization` to support dual-layout:

- Change `CheckoutCustomization` to contain `desktopTopComponents`, `desktopBottomComponents`, `mobileTopComponents`, `mobileBottomComponents`
- OR (cleaner): Keep the existing `CheckoutCustomization` shape as-is for rendering, and use a new `DualCheckoutCustomization` aggregate at the editor level that wraps two `CheckoutCustomization` objects
- Add `CheckoutViewport` type: `'desktop' | 'mobile'`

The cleaner approach: the **editor** works with a `DualCheckoutCustomization`, and the **renderer** (`CheckoutMasterLayout`, `CheckoutPreviewLayout`, `CheckoutEditorMode`) continues receiving a single `CheckoutCustomization` -- the editor simply passes the one matching the `activeViewport`. This avoids changing every downstream component.

### Phase 3: State Machine (New XState Machine)

**New file: `src/pages/checkout-customizer/machines/checkoutEditorMachine.ts`**

Create an XState state machine mirroring the Members Area Builder pattern:

Context:
- `checkoutId: string | null`
- `desktopCustomization: CheckoutCustomization` (design + top + bottom for desktop)
- `mobileCustomization: CheckoutCustomization` (design + top + bottom for mobile)
- `activeViewport: 'desktop' | 'mobile'`
- `isMobileSynced: boolean`
- `selectedComponentId: string | null`
- `viewMode: ViewMode`
- `isPreviewMode: boolean`
- `activeTab: 'components' | 'settings'`
- `activeId: string | null` (DnD)
- `originalDesktopCustomization: CheckoutCustomization`
- `originalMobileCustomization: CheckoutCustomization`

States: `idle -> loading -> ready(pristine|dirty) -> saving -> error`

Events: All current editor actions + viewport switching + sync mode + save/discard

**Supporting files:**
- `src/pages/checkout-customizer/machines/checkoutEditorMachine.types.ts`
- `src/pages/checkout-customizer/machines/checkoutEditorMachine.actions.ts`
- `src/pages/checkout-customizer/machines/checkoutEditorMachine.actors.ts`
- `src/pages/checkout-customizer/machines/checkoutEditorMachine.guards.ts`
- `src/pages/checkout-customizer/machines/index.ts`

### Phase 4: Hook Replacement

**Replace `src/hooks/useCheckoutEditor.ts`** with a new hook that wraps the XState machine:

**New file: `src/pages/checkout-customizer/hooks/useCheckoutEditorState.ts`**

This hook:
- Uses `useMachine(checkoutEditorMachine)`
- Derives `customization` from `activeViewport` (returns desktop or mobile)
- Exposes the same API surface as current `useCheckoutEditor` + new viewport actions
- `setActiveViewport`, `copyDesktopToMobile`, `setMobileSynced`

The old `useCheckoutEditor.ts` file will be deleted since the persistence hook (`useCheckoutPersistence`) will be absorbed into the machine actors.

### Phase 5: Edge Function Changes

**Modify `supabase/functions/checkout-editor/index.ts`:**

1. **`get-editor-data`**: Add `mobile_top_components` and `mobile_bottom_components` to the SELECT query
2. **`update-design`**: Accept `mobileTopComponents` and `mobileBottomComponents` in the request body and save them to the new columns
3. Update `RequestBody` interface to include the new fields

**Modify public checkout data functions** (`resolve-universal-handler.ts`, `resolve-and-load-handler.ts`, `checkout-handler.ts`):
- Add `mobile_top_components` and `mobile_bottom_components` to the SELECT query
- Pass them in the response

### Phase 6: Public Checkout (Mobile Detection)

**Modify `src/modules/checkout-public/components/CheckoutPublicContent.tsx`:**

- Detect if the user is on a mobile device (using screen width or user agent)
- If on mobile and `mobile_top_components` has content: use mobile components
- Otherwise: fall back to desktop components (backward compatible)

### Phase 7: Page Component Update

**Modify `src/pages/CheckoutCustomizer.tsx`:**

- Replace `useCheckoutEditor()` + `useCheckoutPersistence()` with the new unified hook
- Add viewport toggle behavior (already has the UI buttons)
- Wire up save/discard from the machine
- Same UI structure, but now the toggle actually switches the edited component set

### Phase 8: Update EDGE_FUNCTIONS_REGISTRY.md

Document the new parameters accepted by `checkout-editor` edge function.

---

## File Tree (Changes)

```text
NEW FILES:
  src/pages/checkout-customizer/
    machines/
      checkoutEditorMachine.ts              -- XState state machine
      checkoutEditorMachine.types.ts        -- Context, Events, Actor I/O types
      checkoutEditorMachine.actions.ts      -- Pure action helpers
      checkoutEditorMachine.actors.ts       -- Load/Save async actors
      checkoutEditorMachine.guards.ts       -- Guard functions
      index.ts                              -- Barrel export
    hooks/
      useCheckoutEditorState.ts             -- XState wrapper hook (replaces useCheckoutEditor)

MODIFIED FILES:
  src/types/checkoutEditor.ts               -- Add CheckoutViewport type
  src/pages/CheckoutCustomizer.tsx          -- Use new hook, wire viewport switching
  supabase/functions/checkout-editor/       -- Load/Save mobile components
  supabase/functions/checkout-public-data/  -- Serve mobile components
  src/modules/checkout-public/              -- Mobile detection + component selection
  docs/EDGE_FUNCTIONS_REGISTRY.md           -- Document new parameters

DELETED FILES:
  src/hooks/useCheckoutEditor.ts            -- Replaced by state machine
  src/pages/checkout-customizer/hooks/useCheckoutPersistence.ts  -- Absorbed into machine actors
```

## Expected Behavior After Implementation

| Scenario | Before | After |
|----------|--------|-------|
| Click "Desktop" button | Changes preview width | Switches to desktop component set for editing |
| Click "Mobile" button | Changes preview width | Switches to mobile component set for editing |
| Add component in Desktop mode | Added to shared list | Added only to desktop list |
| Add component in Mobile mode | Added to shared list | Added only to mobile list |
| New checkout (no saved mobile) | N/A | Mobile starts synced with desktop |
| Copy Desktop to Mobile | N/A | Clones desktop components to mobile |
| Public checkout on desktop | Shows desktop components | Shows desktop components (unchanged) |
| Public checkout on mobile | Shows same components | Shows mobile-specific components if they exist |
| Save | Saves one set | Saves both desktop and mobile component sets |

## Quality Checkpoint (RISE V3)

| Question | Answer |
|----------|--------|
| Is this the BEST possible solution? | Yes - mirrors proven Members Area Builder architecture |
| Is there a solution with a higher score? | No |
| Does this create technical debt? | Zero - consistent XState pattern across both builders |
| Will we need to "improve later"? | No |
| Does the code survive 10 years? | Yes |
| Am I choosing this because it's faster? | No - it's the most complex option but architecturally correct |
