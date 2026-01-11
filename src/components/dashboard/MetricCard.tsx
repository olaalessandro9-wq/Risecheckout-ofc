import { Card } from "@/components/ui/card";
import { Eye, EyeOff, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  showEye?: boolean;
  isLoading?: boolean;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  delay?: number;
  className?: string;
  iconClassName?: string;
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
  iconClassName
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className={`relative bg-card/40 backdrop-blur-xl border border-border/50 rounded-xl md:rounded-2xl p-4 md:p-5 lg:p-6 hover:border-primary/20 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden h-full bg-gradient-to-br ${className || 'from-card/40 to-card/10'}`}>

        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-primary/10 rounded-full blur-3xl -mr-12 md:-mr-16 -mt-12 md:-mt-16 transition-all duration-500 group-hover:bg-primary/20" />

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              {icon && (
                <div className={`p-2 md:p-2.5 rounded-lg md:rounded-xl ring-1 ring-border/50 group-hover:scale-110 transition-transform duration-300 ${iconClassName || 'bg-primary/10 text-primary'}`}>
                  {icon}
                </div>
              )}
              <span className="text-xs md:text-sm text-muted-foreground font-medium tracking-wide uppercase">{title}</span>
            </div>
            {showEye && (
              <Eye className="w-4 h-4 text-muted-foreground/50 hover:text-primary transition-colors cursor-pointer" />
            )}
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-9 w-32 bg-primary/10" />
            ) : (
              <div className="flex items-end justify-between gap-2 flex-wrap">
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors duration-300 relative">
                  {value}
                </p>
                {trend && (
                  <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${trend.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                    {trend.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    <span>{Math.round(trend.value)}%</span>
                  </div>
                )}
              </div>
            )}

            {trend?.label && (
              <p className="text-xs text-muted-foreground pl-1">{trend.label}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
