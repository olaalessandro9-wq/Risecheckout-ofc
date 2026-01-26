/**
 * DashboardHeader Component
 * 
 * @module dashboard/components
 * @version RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Header do dashboard com título e filtro de data.
 * Consumidor do UltrawidePerformanceContext para SSOT.
 */

import { DateRangeFilter } from "../DateRangeFilter";
import type { DateRangeState, DateRangeActions } from "../../hooks/useDateRangeState";
import { useUltrawidePerformance } from "@/contexts/UltrawidePerformanceContext";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  readonly state: DateRangeState;
  readonly actions: DateRangeActions;
}

export function DashboardHeader({ state, actions }: DashboardHeaderProps) {
  const { disableBlur } = useUltrawidePerformance();

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

      <div
        className={cn(
          "bg-card/50 p-1 md:p-1.5 rounded-xl border border-border w-full md:w-auto",
          !disableBlur && "backdrop-blur-sm"
        )}
      >
        <DateRangeFilter state={state} actions={actions} />
      </div>
    </div>
  );
}
