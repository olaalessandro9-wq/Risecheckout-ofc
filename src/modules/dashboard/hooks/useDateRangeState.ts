/**
 * Hook para estado do DateRange
 * 
 * @module dashboard/hooks
 * @version RISE V3 Compliant - Solution C (9.9 score)
 * 
 * Encapsula useReducer e expõe actions como funções tipadas.
 * Usa DateRangeService para calcular ranges com São Paulo como base.
 */

import { useReducer, useMemo } from "react";
import { dateRangeReducer, createInitialDateRangeState } from "../state/dateRangeReducer";
import { dateRangeService, type DateRangeOutput } from "@/lib/date-range";
import type { 
  DateRangeState, 
  DateRangePreset,
} from "../types/dashboard.types";

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
// HOOK RETURN TYPE (Updated)
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
 * Hook que encapsula todo o estado do DateRange
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
  const [state, dispatch] = useReducer(
    dateRangeReducer,
    undefined,
    createInitialDateRangeState
  );

  // Actions memoizadas
  const actions: DateRangeActions = useMemo(() => ({
    setPreset: (preset: DateRangePreset) => 
      dispatch({ type: "SET_PRESET", payload: preset }),
    openDropdown: () => 
      dispatch({ type: "OPEN_DROPDOWN" }),
    closeDropdown: () => 
      dispatch({ type: "CLOSE_DROPDOWN" }),
    openCalendar: () => 
      dispatch({ type: "OPEN_CALENDAR" }),
    closeCalendar: () => 
      dispatch({ type: "CLOSE_CALENDAR" }),
    setLeftDate: (date: Date | undefined) => 
      dispatch({ type: "SET_LEFT_DATE", payload: date }),
    setRightDate: (date: Date | undefined) => 
      dispatch({ type: "SET_RIGHT_DATE", payload: date }),
    setLeftMonth: (date: Date) => 
      dispatch({ type: "SET_LEFT_MONTH", payload: date }),
    setRightMonth: (date: Date) => 
      dispatch({ type: "SET_RIGHT_MONTH", payload: date }),
    applyCustomRange: () => 
      dispatch({ type: "APPLY_CUSTOM_RANGE" }),
    cancel: () => 
      dispatch({ type: "CANCEL" }),
    restoreSaved: () => 
      dispatch({ type: "RESTORE_SAVED" }),
  }), []);

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
