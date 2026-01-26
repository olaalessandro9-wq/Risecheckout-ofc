/**
 * OverviewPanel Component
 * 
 * @module dashboard/components
 * @version RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Painel lateral com 5 métricas secundárias.
 * Usa configuração declarativa do overviewConfig.
 * Otimizado para ultrawide com animações condicionais via Context SSOT.
 */

import { motion } from "framer-motion";
import { OVERVIEW_ITEMS_CONFIG, getOverviewColorClasses } from "../../config";
import type { DashboardMetrics } from "../../types";
import { useUltrawidePerformance } from "@/contexts/UltrawidePerformanceContext";
import { cn } from "@/lib/utils";

interface OverviewPanelProps {
  readonly metrics: DashboardMetrics | undefined;
  readonly isLoading: boolean;
}

export function OverviewPanel({ metrics, isLoading }: OverviewPanelProps) {
  const { isUltrawide, disableBlur, disableHoverEffects } = useUltrawidePerformance();

  return (
    <div
      className={cn(
        "xl:col-span-1 bg-card/95 border border-border rounded-2xl p-4 md:p-6 flex flex-col min-h-[350px] md:min-h-[400px] lg:min-h-[450px]",
        !isUltrawide && "backdrop-blur-sm"
      )}
    >
      <h3 className="text-base md:text-lg font-semibold text-foreground mb-4 md:mb-6">
        Visão Geral
      </h3>
      
      <div className="flex flex-col gap-2 md:gap-3 flex-1 justify-center overflow-y-auto pr-2 custom-scrollbar">
        {OVERVIEW_ITEMS_CONFIG.map((config) => {
          const colors = getOverviewColorClasses(config.colorScheme);
          const IconComponent = config.icon;
          const value = metrics?.[config.metricKey] ?? 0;

          // Wrapper condicional: div simples em ultrawide
          const Wrapper = isUltrawide ? "div" : motion.div;
          const wrapperProps = isUltrawide
            ? {}
            : {
                initial: { opacity: 0, x: 20 },
                animate: { opacity: 1, x: 0 },
                transition: { delay: config.delay },
              };

          return (
            <Wrapper
              key={config.id}
              {...wrapperProps}
              className={cn(
                "flex items-center justify-between p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-muted/50 to-transparent border border-border cursor-default",
                // Efeitos condicionais
                !isUltrawide && "hover:border-primary/20 hover:translate-y-[-2px] hover:shadow-xl transition-all duration-300 group",
                isUltrawide && "transition-colors duration-200",
                !isUltrawide && colors.glow
              )}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div
                  className={cn(
                    "p-2 md:p-2.5 rounded-lg md:rounded-xl shadow-lg shadow-black/20 ring-1 ring-white/20",
                    colors.iconBg,
                    !isUltrawide && "group-hover:scale-110 transition-transform duration-300"
                  )}
                >
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {config.title}
                  </span>
                  <span className={cn(
                    "text-sm md:text-base font-bold text-foreground",
                    !isUltrawide && "tracking-tight group-hover:tracking-normal transition-all"
                  )}>
                    {isLoading ? "..." : String(value)}
                  </span>
                </div>
              </div>
              <div
                className={cn(
                  "h-8 w-1 rounded-full bg-gradient-to-b",
                  colors.gradient,
                  !isUltrawide && "opacity-20 group-hover:opacity-100 transition-opacity"
                )}
              />
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
