/**
 * Hook para estado do DateRange
 * 
 * @module dashboard/hooks
 * @version RISE V3 Compliant - XState 10.0/10
 * 
 * Encapsula State Machine XState e expõe actions como funções tipadas.
 * Usa DateRangeService para calcular ranges com São Paulo como base.
 */

import { useMemo } from "react";
import { useMachine } from "@xstate/react";
import { dateRangeMachine } from "../machines/dateRangeMachine";
import { dateRangeService, type DateRangeOutput } from "@/lib/date-range";
import type { DateRangePreset } from "../types/dashboard.types";

// ============================================================================
// STATE INTERFACE (Mantém compatibilidade com código existente)
// ============================================================================

export interface DateRangeState {
  readonly preset: DateRangePreset;
  readonly dropdownOpen: boolean;
  readonly calendarOpen: boolean;
  readonly leftDate: Date | undefined;
  readonly rightDate: Date | undefined;
  readonly leftMonth: Date;
  readonly rightMonth: Date;
  readonly savedRange: { from: Date; to: Date } | undefined;
  readonly hasError: boolean;
}

// ============================================================================
// ACTIONS INTERFACE
// ============================================================================

export interface DateRangeActions {
  setPreset: (preset: DateRangePreset) => void;
  openDropdown: () => void;
  closeDropdown: () => void;
  openCalendar: () => void;
  closeCalendar: () => void;
  setLeftDate: (date: Date | undefined) => void;
  setRightDate: (date: Date | undefined) => void;
  setLeftMonth: (date: Date) => void;
  setRightMonth: (date: Date) => void;
  applyCustomRange: () => void;
  cancel: () => void;
  restoreSaved: () => void;
}

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

export interface UseDateRangeStateReturn {
  state: DateRangeState;
  actions: DateRangeActions;
  /** 
   * Calculated date range using São Paulo timezone
   * Use dateRange.startISO and dateRange.endISO for API calls
   */
  dateRange: DateRangeOutput;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook que encapsula todo o estado do DateRange via XState
 * 
 * IMPORTANTE: Todos os cálculos de datas usam São Paulo como timezone base.
 * O dateRange.startISO e dateRange.endISO estão em UTC, mas representam
 * os limites do dia em São Paulo.
 * 
 * @example
 * const { state, actions, dateRange } = useDateRangeState();
 * 
 * // Para API calls, use sempre os valores ISO:
 * await fetchMetrics({
 *   startDate: dateRange.startISO,
 *   endDate: dateRange.endISO,
 *   timezone: dateRange.timezone,
 * });
 */
export function useDateRangeState(): UseDateRangeStateReturn {
  const [machineState, send] = useMachine(dateRangeMachine);

  // Mapear estado da máquina para DateRangeState (compatibilidade)
  const state: DateRangeState = useMemo(() => ({
    preset: machineState.context.preset,
    dropdownOpen: machineState.matches("dropdownOpen"),
    calendarOpen: machineState.matches("calendarOpen"),
    leftDate: machineState.context.leftDate,
    rightDate: machineState.context.rightDate,
    leftMonth: machineState.context.leftMonth,
    rightMonth: machineState.context.rightMonth,
    savedRange: machineState.context.savedRange,
    hasError: machineState.context.hasError,
  }), [machineState]);

  // Actions memoizadas
  const actions: DateRangeActions = useMemo(() => ({
    setPreset: (preset: DateRangePreset) => 
      send({ type: "SELECT_PRESET", preset }),
    openDropdown: () => 
      send({ type: "OPEN_DROPDOWN" }),
    closeDropdown: () => 
      send({ type: "CLOSE_DROPDOWN" }),
    openCalendar: () => 
      send({ type: "OPEN_CALENDAR" }),
    closeCalendar: () => 
      send({ type: "CLOSE_CALENDAR" }),
    setLeftDate: (date: Date | undefined) => 
      send({ type: "SET_LEFT_DATE", date }),
    setRightDate: (date: Date | undefined) => 
      send({ type: "SET_RIGHT_DATE", date }),
    setLeftMonth: (date: Date) => 
      send({ type: "SET_LEFT_MONTH", month: date }),
    setRightMonth: (date: Date) => 
      send({ type: "SET_RIGHT_MONTH", month: date }),
    applyCustomRange: () => 
      send({ type: "APPLY_CUSTOM_RANGE" }),
    cancel: () => 
      send({ type: "CANCEL" }),
    restoreSaved: () => 
      send({ type: "RESTORE_SAVED" }),
  }), [send]);

  // Calcular dateRange usando o DateRangeService (São Paulo timezone)
  const dateRange = useMemo((): DateRangeOutput => {
    if (state.preset === "custom" && state.savedRange) {
      // Custom range selected by user
      return dateRangeService.getCustomRange({
        from: state.savedRange.from,
        to: state.savedRange.to,
      });
    }
    
    // Standard preset - use service to calculate correct boundaries
    const preset = state.preset === "custom" ? "today" : state.preset;
    return dateRangeService.getRange(preset);
  }, [state.preset, state.savedRange]);

  return { state, actions, dateRange };
}
