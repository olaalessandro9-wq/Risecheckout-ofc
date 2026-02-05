/**
 * MetricCard Component
 * 
 * @module dashboard/components
 * @version RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Card individual para exibição de métrica.
 * ZERO framer-motion - CSS animations nativas (GPU-accelerated).
 * CSS containment para isolar repaints durante sidebar transitions.
 */

import { Eye, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";
import type { TrendData } from "../../types";
import { useUltrawidePerformance } from "@/contexts/UltrawidePerformanceContext";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly showEye?: boolean;
  readonly isLoading?: boolean;
  readonly icon?: ReactNode;
  readonly trend?: TrendData;
  readonly delay?: number;
  readonly className?: string;
  readonly iconClassName?: string;
}

export function MetricCard({
  title,
  value,
  showEye = true,
  isLoading = false,
  icon,
  trend,
  delay = 0,
  className,
  iconClassName,
}: MetricCardProps) {
  const { disableAllAnimations, disableBlur, disableHoverEffects } = useUltrawidePerformance();

  return (
    <div
      className={cn(
        "relative group h-full",
        !disableAllAnimations && "animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
      )}
      style={{
        animationDelay: disableAllAnimations ? undefined : `${delay * 50}ms`,
        contain: "layout style paint",
      }}
    >
      <div
        className={cn(
          "relative bg-card/95 border border-border/50 rounded-xl md:rounded-2xl p-4 md:p-5 lg:p-6 overflow-hidden h-full bg-gradient-to-br",
          // Efeitos condicionais - SEM backdrop-blur, SEM transition-all
          !disableHoverEffects && "hover:border-primary/20 hover:shadow-lg transition-colors transition-shadow duration-200",
          disableHoverEffects && "transition-colors duration-150",
          className || "from-card/95 to-card/90"
        )}
      >
        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              {icon && (
                <div
                  className={cn(
                    "p-2 md:p-2.5 rounded-lg md:rounded-xl ring-1 ring-border/50",
                    !disableHoverEffects && "group-hover:scale-110 transition-transform duration-200",
                    iconClassName || "bg-primary/10 text-primary"
                  )}
                >
                  {icon}
                </div>
              )}
              <span className="text-xs md:text-sm text-muted-foreground font-medium tracking-wide uppercase">
                {title}
              </span>
            </div>
            {showEye && (
              <Eye className="w-4 h-4 text-muted-foreground/50 hover:text-primary transition-colors cursor-pointer" />
            )}
          </div>

          {/* Content: Value + Trend lado a lado */}
          <div className="flex items-end justify-between gap-3">
            {/* Coluna Esquerda: Valor Principal */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <Skeleton className="h-9 w-32 bg-primary/10" />
              ) : (
                <p className={cn(
                  "text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight",
                  !disableHoverEffects && "group-hover:text-primary transition-colors duration-200"
                )}>
                  {value}
                </p>
              )}
            </div>

            {/* Coluna Direita: Trend Block */}
            {trend && (
              <div className="pl-2 md:pl-3 py-1 flex-shrink-0">
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs md:text-sm font-semibold",
                    trend.isPositive ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {trend.isPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  )}
                  <span>{Math.round(trend.value)}%</span>
                </div>
                {trend.label && (
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 whitespace-nowrap">
                    {trend.label}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
