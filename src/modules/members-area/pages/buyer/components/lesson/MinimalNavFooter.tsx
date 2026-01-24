/**
 * MinimalNavFooter - Cakto-parity navigation footer
 * Clean, professional design with proper spacing and hover states
 */

import { ChevronLeft, ChevronRight, Check, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MinimalNavFooterProps {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete?: () => void;
  isCompleting?: boolean;
  isCompleted?: boolean;
}

export function MinimalNavFooter({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onComplete,
  isCompleting = false,
  isCompleted = false,
}: MinimalNavFooterProps) {
  return (
    <div className="flex items-center justify-between py-5 border-t border-border">
      {/* Complete Button - Left Side - Cakto Style */}
      <div className="flex items-center">
        {onComplete && (
          <button
            onClick={onComplete}
            disabled={isCompleting}
            className={cn(
              "group flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200",
              isCompleted
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30"
                : "bg-transparent text-foreground border-border hover:bg-muted hover:border-muted-foreground/30"
            )}
          >
            {isCompleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isCompleted ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isCompleted ? "Aula concluída" : "Concluir aula"}
            </span>
            <span className="sm:hidden">
              {isCompleted ? "Concluída" : "Concluir"}
            </span>
          </button>
        )}
      </div>

      {/* Navigation Buttons - Right Side - Cakto Style */}
      <div className="flex items-center gap-3">
        {/* Previous Button */}
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200",
            hasPrevious
              ? "text-foreground border-border hover:bg-muted hover:border-muted-foreground/30"
              : "text-muted-foreground/50 border-border/50 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Next Button - Primary */}
        <button
          onClick={onNext}
          disabled={!hasNext}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            hasNext
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <span className="hidden sm:inline">Próxima</span>
          <span className="sm:hidden">Próx</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
