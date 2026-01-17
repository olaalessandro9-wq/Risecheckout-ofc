/**
 * Hook para estado do DateRange
 * 
 * @module dashboard/hooks
 * @version RISE V3 Compliant
 * 
 * Encapsula useReducer e expõe actions como funções tipadas.
 */

import { useReducer, useMemo, useCallback } from "react";
import { subDays } from "date-fns";
import { dateRangeReducer, createInitialDateRangeState } from "../state/dateRangeReducer";
import type { 
  DateRangeState, 
  DateRangePreset, 
  DateRange 
} from "../types/dashboard.types";

// ============================================================================
// DATE RANGE CALCULATION
// ============================================================================

/**
 * Calcula o intervalo de datas baseado no preset
 */
function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case "today":
      return { startDate: todayStart, endDate: todayEnd };

    case "yesterday": {
      const yesterday = subDays(todayStart, 1);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return { startDate: yesterday, endDate: yesterdayEnd };
    }

    case "7days": {
      const start = subDays(todayStart, 6);
      return { startDate: start, endDate: todayEnd };
    }

    case "30days": {
      const start = subDays(todayStart, 29);
      return { startDate: start, endDate: todayEnd };
    }

    case "max":
      return { 
        startDate: new Date("2020-01-01T00:00:00.000Z"), 
        endDate: todayEnd 
      };

    default:
      return { startDate: todayStart, endDate: todayEnd };
  }
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
// HOOK
// ============================================================================

export interface UseDateRangeStateReturn {
  state: DateRangeState;
  actions: DateRangeActions;
  dateRange: DateRange;
}

/**
 * Hook que encapsula todo o estado do DateRange
 * 
 * Retorna:
 * - state: Estado atual do reducer
 * - actions: Funções tipadas para dispatch
 * - dateRange: Intervalo de datas calculado (startDate, endDate)
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

  // Calcular dateRange derivado do estado
  const dateRange = useMemo((): DateRange => {
    if (state.preset === "custom" && state.savedRange) {
      return {
        startDate: state.savedRange.from,
        endDate: state.savedRange.to,
      };
    }
    return getDateRangeFromPreset(state.preset);
  }, [state.preset, state.savedRange]);

  return { state, actions, dateRange };
}
