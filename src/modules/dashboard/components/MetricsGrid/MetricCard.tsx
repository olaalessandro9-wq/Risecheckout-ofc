/**
 * MetricCard Component (Migrado)
 * 
 * @module dashboard/components
 * @version RISE V3 Compliant
 * 
 * Card individual para exibição de métrica.
 * Aceita configuração declarativa via MetricConfig.
 */

import { Eye, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { TrendData } from "../../types";

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group h-full"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Card */}
      <div
        className={`relative bg-card/40 backdrop-blur-xl border border-border/50 rounded-xl md:rounded-2xl p-4 md:p-5 lg:p-6 hover:border-primary/20 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden h-full bg-gradient-to-br ${className || "from-card/40 to-card/10"}`}
      >
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-primary/10 rounded-full blur-3xl -mr-12 md:-mr-16 -mt-12 md:-mt-16 transition-all duration-500 group-hover:bg-primary/20" />

        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              {icon && (
                <div
                  className={`p-2 md:p-2.5 rounded-lg md:rounded-xl ring-1 ring-border/50 group-hover:scale-110 transition-transform duration-300 ${iconClassName || "bg-primary/10 text-primary"}`}
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
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors duration-300">
                  {value}
                </p>
              )}
            </div>

            {/* Coluna Direita: Trend Block com Barra Lateral */}
            {trend && (
              <div className="pl-2 md:pl-3 py-1 flex-shrink-0">
                {/* Linha 1: Seta + Porcentagem */}
                <div
                  className={`flex items-center gap-1 text-xs md:text-sm font-semibold ${
                    trend.isPositive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {trend.isPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  )}
                  <span>{Math.round(trend.value)}%</span>
                </div>

                {/* Linha 2: Label de Comparação */}
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
    </motion.div>
  );
}
