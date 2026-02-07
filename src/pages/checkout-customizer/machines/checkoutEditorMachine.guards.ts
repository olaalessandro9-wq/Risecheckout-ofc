/**
 * Checkout Editor Machine - Guard Functions
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module checkout-customizer/machines
 */

import type { CheckoutEditorMachineContext } from "./checkoutEditorMachine.types";

// ============================================================================
// DIRTY CHECK
// ============================================================================

function customizationChanged(
  current: import("@/types/checkoutEditor").CheckoutCustomization,
  original: import("@/types/checkoutEditor").CheckoutCustomization
): boolean {
  return JSON.stringify(current) !== JSON.stringify(original);
}

// ============================================================================
// GUARDS
// ============================================================================

export function isDirty({
  context,
}: {
  context: CheckoutEditorMachineContext;
}): boolean {
  const desktopChanged = customizationChanged(
    context.desktopCustomization,
    context.originalDesktopCustomization
  );
  const mobileChanged = customizationChanged(
    context.mobileCustomization,
    context.originalMobileCustomization
  );
  const syncChanged = context.isMobileSynced !== context.originalIsMobileSynced;
  return desktopChanged || mobileChanged || syncChanged;
}

export function canSave({
  context,
}: {
  context: CheckoutEditorMachineContext;
}): boolean {
  return isDirty({ context }) && context.checkoutId !== null;
}
