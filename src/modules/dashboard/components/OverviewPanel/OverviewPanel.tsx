/**
 * OverviewPanel Component
 * 
 * @module dashboard/components
 * @version RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Painel lateral com 5 métricas secundárias.
 * ZERO framer-motion - CSS animations nativas (GPU-accelerated).
 * CSS containment para isolar repaints.
 */

import { OVERVIEW_ITEMS_CONFIG, getOverviewColorClasses } from "../../config";
import type { DashboardMetrics } from "../../types";
import { useUltrawidePerformance } from "@/contexts/UltrawidePerformanceContext";
import { cn } from "@/lib/utils";

interface OverviewPanelProps {
  readonly metrics: DashboardMetrics | undefined;
  readonly isLoading: boolean;
}

export function OverviewPanel({ metrics, isLoading }: OverviewPanelProps) {
  const { disableAllAnimations, disableHoverEffects } = useUltrawidePerformance();

  return (
    <div
      className="xl:col-span-1 bg-card/95 border border-border rounded-2xl p-4 md:p-6 flex flex-col min-h-[350px] md:min-h-[400px] lg:min-h-[450px]"
      style={{ contain: "layout style paint" }}
    >
      <h3 className="text-base md:text-lg font-semibold text-foreground mb-4 md:mb-6">
        Visão Geral
      </h3>
      
      <div className="flex flex-col gap-2 md:gap-3 flex-1 justify-center overflow-y-auto pr-2 custom-scrollbar">
        {OVERVIEW_ITEMS_CONFIG.map((config) => {
          const colors = getOverviewColorClasses(config.colorScheme);
          const IconComponent = config.icon;
          const value = metrics?.[config.metricKey] ?? 0;

          return (
            <div
              key={config.id}
              className={cn(
                "flex items-center justify-between p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-muted/50 to-transparent border border-border cursor-default",
                // CSS animation nativa com delay
                !disableAllAnimations && "animate-in fade-in slide-in-from-right-2 fill-mode-both",
                // Hover effects condicionais - SEM translate (causa reflow)
                !disableHoverEffects && "hover:border-primary/20 hover:shadow-md transition-colors transition-shadow duration-200",
                disableHoverEffects && "transition-colors duration-150"
              )}
              style={{
                animationDelay: disableAllAnimations ? undefined : `${config.delay * 1000}ms`,
              }}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div
                  className={cn(
                    "p-2 md:p-2.5 rounded-lg md:rounded-xl shadow-lg shadow-black/20 ring-1 ring-white/20",
                    colors.iconBg,
                    !disableHoverEffects && "group-hover:scale-110 transition-transform duration-200"
                  )}
                >
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {config.title}
                  </span>
                  <span className="text-sm md:text-base font-bold text-foreground">
                    {isLoading ? "..." : String(value)}
                  </span>
                </div>
              </div>
              <div
                className={cn(
                  "h-8 w-1 rounded-full bg-gradient-to-b opacity-40",
                  colors.gradient
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
