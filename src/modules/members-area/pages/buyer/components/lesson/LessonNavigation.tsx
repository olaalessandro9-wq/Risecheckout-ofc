/**
 * LessonNavigation - Footer navigation with previous/next/complete buttons
 */

import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LessonNavigationProps {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete?: () => void;
  isCompleting?: boolean;
}

export function LessonNavigation({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onComplete,
  isCompleting = false,
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
            className="gap-2 border-green-500/50 text-green-600 hover:bg-green-500/10 hover:text-green-500"
          >
            {isCompleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Marcar como concluída</span>
            <span className="sm:hidden">Concluir</span>
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