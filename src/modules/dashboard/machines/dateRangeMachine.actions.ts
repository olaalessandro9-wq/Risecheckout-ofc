/**
 * DateRange Machine Actions
 * 
 * @module dashboard/machines
 * @version RISE V3 Compliant - XState 10.0/10
 * 
 * Actions (mutações de contexto) para a DateRange State Machine.
 */

import { assign } from "xstate";
import { startOfMonth } from "date-fns";
import type { DateRangeMachineContext, DateRangeMachineEvent } from "./dateRangeMachine.types";

// ============================================================================
// PRESET ACTIONS
// ============================================================================

/**
 * Seleciona um preset de data
 */
export const selectPreset = assign<
  DateRangeMachineContext,
  Extract<DateRangeMachineEvent, { type: "SELECT_PRESET" }>,
  unknown,
  DateRangeMachineEvent,
  never
>({
  preset: ({ event }) => event.preset,
});

// ============================================================================
// CALENDAR ACTIONS
// ============================================================================

/**
 * Abre o calendário, restaurando range salvo se existir
 */
export const openCalendar = assign<
  DateRangeMachineContext,
  Extract<DateRangeMachineEvent, { type: "OPEN_CALENDAR" }>,
  unknown,
  DateRangeMachineEvent,
  never
>(({ context }) => {
  if (context.savedRange) {
    return {
      leftDate: context.savedRange.from,
      rightDate: context.savedRange.to,
      leftMonth: startOfMonth(context.savedRange.from),
      rightMonth: startOfMonth(context.savedRange.to),
    };
  }
  return {
    leftDate: undefined,
    rightDate: undefined,
  };
});

/**
 * Define a data esquerda do calendário
 */
export const setLeftDate = assign<
  DateRangeMachineContext,
  Extract<DateRangeMachineEvent, { type: "SET_LEFT_DATE" }>,
  unknown,
  DateRangeMachineEvent,
  never
>(({ context, event }) => {
  const leftDate = event.date;
  const hasError = !!(leftDate && context.rightDate && context.rightDate <= leftDate);
  return {
    leftDate,
    hasError,
  };
});

/**
 * Define a data direita do calendário
 */
export const setRightDate = assign<
  DateRangeMachineContext,
  Extract<DateRangeMachineEvent, { type: "SET_RIGHT_DATE" }>,
  unknown,
  DateRangeMachineEvent,
  never
>(({ context, event }) => {
  const rightDate = event.date;
  const hasError = !!(context.leftDate && rightDate && rightDate <= context.leftDate);
  return {
    rightDate,
    hasError,
  };
});

/**
 * Define o mês esquerdo visível
 */
export const setLeftMonth = assign<
  DateRangeMachineContext,
  Extract<DateRangeMachineEvent, { type: "SET_LEFT_MONTH" }>,
  unknown,
  DateRangeMachineEvent,
  never
>({
  leftMonth: ({ event }) => event.month,
});

/**
 * Define o mês direito visível
 */
export const setRightMonth = assign<
  DateRangeMachineContext,
  Extract<DateRangeMachineEvent, { type: "SET_RIGHT_MONTH" }>,
  unknown,
  DateRangeMachineEvent,
  never
>({
  rightMonth: ({ event }) => event.month,
});

/**
 * Aplica o range customizado selecionado
 */
export const applyCustomRange = assign<
  DateRangeMachineContext,
  Extract<DateRangeMachineEvent, { type: "APPLY_CUSTOM_RANGE" }>,
  unknown,
  DateRangeMachineEvent,
  never
>(({ context }) => {
  if (!context.leftDate || !context.rightDate || context.hasError) {
    return {};
  }
  return {
    preset: "custom" as const,
    savedRange: { from: context.leftDate, to: context.rightDate },
  };
});

/**
 * Cancela a seleção atual
 */
export const cancelSelection = assign<
  DateRangeMachineContext,
  Extract<DateRangeMachineEvent, { type: "CANCEL" }>,
  unknown,
  DateRangeMachineEvent,
  never
>({
  leftDate: undefined,
  rightDate: undefined,
  hasError: false,
});

/**
 * Restaura o range salvo
 */
export const restoreSaved = assign<
  DateRangeMachineContext,
  Extract<DateRangeMachineEvent, { type: "RESTORE_SAVED" }>,
  unknown,
  DateRangeMachineEvent,
  never
>(({ context }) => {
  if (!context.savedRange) {
    return {};
  }
  return {
    leftDate: context.savedRange.from,
    rightDate: context.savedRange.to,
    leftMonth: startOfMonth(context.savedRange.from),
    rightMonth: startOfMonth(context.savedRange.to),
    hasError: false,
  };
});
