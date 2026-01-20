/**
 * DateRange Machine Types
 * 
 * @module dashboard/machines
 * @version RISE V3 Compliant - XState 10.0/10
 * 
 * Tipos TypeScript para a State Machine de DateRange.
 */

import type { DateRangePreset } from "../types/dashboard.types";

// ============================================================================
// SAVED RANGE
// ============================================================================

/**
 * Range customizado salvo pelo usuário
 */
export interface SavedRange {
  readonly from: Date;
  readonly to: Date;
}

// ============================================================================
// MACHINE CONTEXT
// ============================================================================

/**
 * Contexto da DateRange State Machine
 */
export interface DateRangeMachineContext {
  readonly preset: DateRangePreset;
  readonly leftDate: Date | undefined;
  readonly rightDate: Date | undefined;
  readonly leftMonth: Date;
  readonly rightMonth: Date;
  readonly savedRange: SavedRange | undefined;
  readonly hasError: boolean;
}

// ============================================================================
// MACHINE EVENTS (DISCRIMINATED UNION)
// ============================================================================

export type DateRangeMachineEvent =
  | { readonly type: "SELECT_PRESET"; readonly preset: DateRangePreset }
  | { readonly type: "OPEN_DROPDOWN" }
  | { readonly type: "CLOSE_DROPDOWN" }
  | { readonly type: "OPEN_CALENDAR" }
  | { readonly type: "CLOSE_CALENDAR" }
  | { readonly type: "SET_LEFT_DATE"; readonly date: Date | undefined }
  | { readonly type: "SET_RIGHT_DATE"; readonly date: Date | undefined }
  | { readonly type: "SET_LEFT_MONTH"; readonly month: Date }
  | { readonly type: "SET_RIGHT_MONTH"; readonly month: Date }
  | { readonly type: "APPLY_CUSTOM_RANGE" }
  | { readonly type: "CANCEL" }
  | { readonly type: "RESTORE_SAVED" };

// ============================================================================
// INITIAL CONTEXT FACTORY
// ============================================================================

/**
 * Cria o contexto inicial da máquina
 */
export function createInitialDateRangeContext(): DateRangeMachineContext {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return {
    preset: "30days",
    leftDate: undefined,
    rightDate: undefined,
    leftMonth: now,
    rightMonth: nextMonth,
    savedRange: undefined,
    hasError: false,
  };
}
