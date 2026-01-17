/**
 * DateRange Reducer
 * 
 * @module dashboard/state
 * @version RISE V3 Compliant
 * 
 * Single Source of Truth para estado do filtro de data.
 * Elimina os 7+ useState do componente DateRangeFilter.
 */

import { startOfMonth } from "date-fns";
import type { DateRangeState, DateRangeAction } from "../types/dashboard.types";

// ============================================================================
// INITIAL STATE
// ============================================================================

/**
 * Cria estado inicial do DateRange
 */
export function createInitialDateRangeState(): DateRangeState {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return {
    preset: "30days",
    dropdownOpen: false,
    calendarOpen: false,
    leftDate: undefined,
    rightDate: undefined,
    leftMonth: now,
    rightMonth: nextMonth,
    savedRange: undefined,
    hasError: false,
  };
}

// ============================================================================
// REDUCER
// ============================================================================

/**
 * Reducer para estado do filtro de data
 * 
 * Handles all date range state mutations in a centralized way.
 */
export function dateRangeReducer(
  state: DateRangeState,
  action: DateRangeAction
): DateRangeState {
  switch (action.type) {
    case "SET_PRESET":
      return {
        ...state,
        preset: action.payload,
        dropdownOpen: false,
      };

    case "OPEN_DROPDOWN":
      return {
        ...state,
        dropdownOpen: true,
      };

    case "CLOSE_DROPDOWN":
      return {
        ...state,
        dropdownOpen: false,
      };

    case "OPEN_CALENDAR": {
      // Se tem range salvo, restaurar nas datas
      if (state.savedRange) {
        return {
          ...state,
          calendarOpen: true,
          dropdownOpen: false,
          leftDate: state.savedRange.from,
          rightDate: state.savedRange.to,
          leftMonth: startOfMonth(state.savedRange.from),
          rightMonth: startOfMonth(state.savedRange.to),
        };
      }
      return {
        ...state,
        calendarOpen: true,
        dropdownOpen: false,
        leftDate: undefined,
        rightDate: undefined,
      };
    }

    case "CLOSE_CALENDAR":
      return {
        ...state,
        calendarOpen: false,
      };

    case "SET_LEFT_DATE": {
      const leftDate = action.payload;
      const hasError = !!(leftDate && state.rightDate && state.rightDate <= leftDate);
      return {
        ...state,
        leftDate,
        hasError,
      };
    }

    case "SET_RIGHT_DATE": {
      const rightDate = action.payload;
      const hasError = !!(state.leftDate && rightDate && rightDate <= state.leftDate);
      return {
        ...state,
        rightDate,
        hasError,
      };
    }

    case "SET_LEFT_MONTH":
      return {
        ...state,
        leftMonth: action.payload,
      };

    case "SET_RIGHT_MONTH":
      return {
        ...state,
        rightMonth: action.payload,
      };

    case "APPLY_CUSTOM_RANGE": {
      // Só aplica se ambas as datas estão definidas e válidas
      if (!state.leftDate || !state.rightDate || state.hasError) {
        return state;
      }
      return {
        ...state,
        preset: "custom",
        savedRange: { from: state.leftDate, to: state.rightDate },
        calendarOpen: false,
        dropdownOpen: false,
      };
    }

    case "CANCEL":
      return {
        ...state,
        leftDate: undefined,
        rightDate: undefined,
        hasError: false,
        calendarOpen: false,
      };

    case "RESTORE_SAVED":
      if (state.savedRange) {
        return {
          ...state,
          leftDate: state.savedRange.from,
          rightDate: state.savedRange.to,
          leftMonth: startOfMonth(state.savedRange.from),
          rightMonth: startOfMonth(state.savedRange.to),
          hasError: false,
        };
      }
      return state;

    default:
      return state;
  }
}
