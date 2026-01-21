/**
 * DateRangeFilter Container Component
 * 
 * @module dashboard/components
 * @version RISE V3 Compliant
 * 
 * Container que compõe DateRangeDropdown + DateRangeCalendar.
 * Zero useState interno - usa reducer via props.
 */

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRangeDropdown } from "./DateRangeDropdown";
import { DateRangeCalendar } from "./DateRangeCalendar";
import type { DateRangeState, DateRangeActions } from "../../hooks/useDateRangeState";
import { getPresetLabel } from "../../config";

interface DateRangeFilterProps {
  readonly state: DateRangeState;
  readonly actions: DateRangeActions;
}

export function DateRangeFilter({ state, actions }: DateRangeFilterProps) {
  // Calcular label de exibição
  const displayLabel = state.preset === "custom" && state.savedRange
    ? `${format(state.savedRange.from, "dd/MM", { locale: ptBR })} - ${format(state.savedRange.to, "dd/MM", { locale: ptBR })}`
    : getPresetLabel(state.preset);

  return (
    <>
      <DateRangeDropdown
        isOpen={state.dropdownOpen}
        onOpenChange={(open) => open ? actions.openDropdown() : actions.closeDropdown()}
        selectedPreset={state.preset}
        displayLabel={displayLabel}
        onPresetSelect={actions.setPreset}
        onCustomClick={actions.openCalendar}
      />

      <DateRangeCalendar
        isOpen={state.calendarOpen}
        onOpenChange={(open) => open ? actions.openCalendar() : actions.closeCalendar()}
        leftDate={state.leftDate}
        rightDate={state.rightDate}
        leftMonth={state.leftMonth}
        rightMonth={state.rightMonth}
        hasError={state.hasError}
        onLeftDateChange={actions.setLeftDate}
        onRightDateChange={actions.setRightDate}
        onLeftMonthChange={actions.setLeftMonth}
        onRightMonthChange={actions.setRightMonth}
        onApply={actions.applyCustomRange}
        onCancel={actions.cancel}
      />
    </>
  );
}
