/**
 * MinimalNavFooter - Minimalist navigation footer (Cakto-style)
 * Compact buttons: complete on left, prev/next on right
 */

import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
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
    <div className="flex items-center justify-between py-4 border-t border-border/50 mt-6">
      {/* Complete Button - Left Side */}
      <div className="flex items-center">
        {onComplete && (
          <button
            onClick={onComplete}
            disabled={isCompleting}
            className={cn(
              "group flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
              isCompleted
                ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30"
                : "bg-muted/50 text-muted-foreground border border-border hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30"
            )}
          >
            {isCompleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className={cn(
                "h-3.5 w-3.5 transition-colors",
                isCompleted && "group-hover:hidden"
              )} />
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

      {/* Navigation Buttons - Right Side */}
      <div className="flex items-center gap-2">
        {/* Previous Button - Ghost/Subtle */}
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 text-sm rounded-full transition-all duration-200",
            hasPrevious
              ? "text-muted-foreground hover:text-foreground hover:bg-muted"
              : "text-muted-foreground/40 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Next Button - Primary Style */}
        <button
          onClick={onNext}
          disabled={!hasNext}
          className={cn(
            "flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
            hasNext
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
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
