/**
 * Dashboard Machines - Barrel Export
 * 
 * @module dashboard/machines
 * @version RISE V3 Compliant - XState 10.0/10
 */

export { dateRangeMachine } from "./dateRangeMachine";
export type { DateRangeMachine } from "./dateRangeMachine";

export {
  type DateRangeMachineContext,
  type DateRangeMachineEvent,
  type SavedRange,
  createInitialDateRangeContext,
} from "./dateRangeMachine.types";

export {
  canApplyRange,
  hasSavedRange,
  hasRangeError,
  hasBothDates,
} from "./dateRangeMachine.guards";

export {
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
