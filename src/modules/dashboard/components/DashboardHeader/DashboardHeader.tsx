/**
 * DashboardHeader Component
 * 
 * @module dashboard/components
 * @version RISE V3 Compliant
 * 
 * Header do dashboard com título e filtro de data.
 */

import { DateRangeFilter } from "../DateRangeFilter";
import type { DateRangeState } from "../../types";
import type { DateRangeActions } from "../../hooks/useDateRangeState";

interface DashboardHeaderProps {
  readonly state: DateRangeState;
  readonly actions: DateRangeActions;
}

export function DashboardHeader({ state, actions }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/50 mb-1 md:mb-2">
          Dashboard
        </h1>
        <p className="text-sm md:text-base text-muted-foreground font-medium">
          Visão geral do seu desempenho e métricas
        </p>
      </div>

      <div className="bg-card/50 backdrop-blur-sm p-1 md:p-1.5 rounded-xl border border-border w-full md:w-auto">
        <DateRangeFilter state={state} actions={actions} />
      </div>
    </div>
  );
}
