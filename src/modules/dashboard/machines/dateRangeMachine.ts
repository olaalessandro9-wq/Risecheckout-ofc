/**
 * DateRange State Machine
 * 
 * @module dashboard/machines
 * @version RISE V3 Compliant - XState 10.0/10
 * 
 * State Machine XState v5 que gerencia TODO o estado do filtro de datas.
 * Elimina estados impossíveis através de estados explícitos (idle/dropdownOpen/calendarOpen).
 */

import { setup } from "xstate";
import {
  type DateRangeMachineContext,
  type DateRangeMachineEvent,
  createInitialDateRangeContext,
} from "./dateRangeMachine.types";
import {
  canApplyRange,
  hasSavedRange,
} from "./dateRangeMachine.guards";
import {
  selectPreset,
  openCalendar,
  setLeftDate,
  setRightDate,
  setLeftMonth,
  setRightMonth,
  applyCustomRange,
  cancelSelection,
  restoreSaved,
} from "./dateRangeMachine.actions";

// ============================================================================
// MACHINE DEFINITION
// ============================================================================

/**
 * DateRange State Machine
 * 
 * Estados:
 * - idle: Estado padrão (dropdown e calendar fechados)
 * - dropdownOpen: Usuário está selecionando um preset
 * - calendarOpen: Usuário está selecionando range customizado
 * 
 * Esta máquina garante que dropdown e calendar nunca estejam abertos
 * simultaneamente (estado impossível eliminado por design).
 */
export const dateRangeMachine = setup({
  types: {
    context: {} as DateRangeMachineContext,
    events: {} as DateRangeMachineEvent,
  },
  guards: {
    canApplyRange: ({ context }) => canApplyRange(context),
    hasSavedRange: ({ context }) => hasSavedRange(context),
  },
  actions: {
    selectPreset,
    openCalendar,
    setLeftDate,
    setRightDate,
    setLeftMonth,
    setRightMonth,
    applyCustomRange,
    cancelSelection,
    restoreSaved,
  },
}).createMachine({
  id: "dateRange",
  context: createInitialDateRangeContext,
  initial: "idle",
  states: {
    idle: {
      description: "Estado padrão - dropdown e calendar fechados",
      on: {
        OPEN_DROPDOWN: {
          target: "dropdownOpen",
        },
        OPEN_CALENDAR: {
          target: "calendarOpen",
          actions: "openCalendar",
        },
        SELECT_PRESET: {
          actions: "selectPreset",
        },
        RESTORE_SAVED: {
          guard: "hasSavedRange",
          actions: "restoreSaved",
        },
      },
    },
    dropdownOpen: {
      description: "Usuário está selecionando um preset",
      on: {
        CLOSE_DROPDOWN: {
          target: "idle",
        },
        SELECT_PRESET: {
          target: "idle",
          actions: "selectPreset",
        },
        OPEN_CALENDAR: {
          target: "calendarOpen",
          actions: "openCalendar",
        },
      },
    },
    calendarOpen: {
      description: "Usuário está selecionando range customizado",
      on: {
        CLOSE_CALENDAR: {
          target: "idle",
        },
        CANCEL: {
          target: "idle",
          actions: "cancelSelection",
        },
        SET_LEFT_DATE: {
          actions: "setLeftDate",
        },
        SET_RIGHT_DATE: {
          actions: "setRightDate",
        },
        SET_LEFT_MONTH: {
          actions: "setLeftMonth",
        },
        SET_RIGHT_MONTH: {
          actions: "setRightMonth",
        },
        APPLY_CUSTOM_RANGE: {
          target: "idle",
          guard: "canApplyRange",
          actions: "applyCustomRange",
        },
        RESTORE_SAVED: {
          guard: "hasSavedRange",
          actions: "restoreSaved",
        },
      },
    },
  },
});

export type DateRangeMachine = typeof dateRangeMachine;
