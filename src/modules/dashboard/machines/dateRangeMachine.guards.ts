/**
 * DateRange Machine Guards
 * 
 * @module dashboard/machines
 * @version RISE V3 Compliant - XState 10.0/10
 * 
 * Guards (condicionais) para transições da DateRange State Machine.
 */

import type { DateRangeMachineContext } from "./dateRangeMachine.types";

// ============================================================================
// GUARD FUNCTIONS
// ============================================================================

/**
 * Verifica se o range é válido para aplicação
 * Requer ambas as datas definidas e sem erro
 */
export function canApplyRange(context: DateRangeMachineContext): boolean {
  return (
    context.leftDate !== undefined &&
    context.rightDate !== undefined &&
    !context.hasError
  );
}

/**
 * Verifica se há um range salvo
 */
export function hasSavedRange(context: DateRangeMachineContext): boolean {
  return context.savedRange !== undefined;
}

/**
 * Verifica se o range atual tem erro
 */
export function hasRangeError(context: DateRangeMachineContext): boolean {
  return context.hasError;
}

/**
 * Verifica se ambas as datas estão definidas
 */
export function hasBothDates(context: DateRangeMachineContext): boolean {
  return context.leftDate !== undefined && context.rightDate !== undefined;
}
