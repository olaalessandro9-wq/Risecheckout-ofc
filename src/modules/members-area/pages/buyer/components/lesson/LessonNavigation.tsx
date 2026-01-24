/**
 * LessonNavigation - Footer navigation with previous/next/complete buttons
 */

import { ChevronLeft, ChevronRight, Check, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LessonNavigationProps {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete?: () => void;
  isCompleting?: boolean;
  isCompleted?: boolean;
}

export function LessonNavigation({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onComplete,
  isCompleting = false,
  isCompleted = false,
}: LessonNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-border">
      {/* Complete Button - Left Side */}
      <div className="flex items-center gap-2">
        {onComplete && (
          <Button
            variant="outline"
            onClick={onComplete}
            disabled={isCompleting}
            className={cn(
              "gap-2 transition-colors",
              isCompleted 
                ? "bg-green-500/20 border-green-500 text-green-500 hover:bg-red-500/10 hover:border-red-500 hover:text-red-500"
                : "border-green-500/50 text-green-600 hover:bg-green-500/10 hover:text-green-500"
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
              {isCompleted ? "Concluída (desmarcar)" : "Marcar como concluída"}
            </span>
            <span className="sm:hidden">
              {isCompleted ? "Concluída" : "Concluir"}
            </span>
          </Button>
        )}
      </div>

      {/* Navigation Buttons - Right Side */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        <Button 
          onClick={onNext} 
          disabled={!hasNext}
          className="gap-1"
        >
          <span className="hidden sm:inline">Próxima</span>
          <span className="sm:hidden">Próx</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}