/**
 * LessonHeader - Sticky header with back button, course name, and lesson title
 */

import { Link } from "react-router-dom";
import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonRating } from "./LessonRating";

interface LessonHeaderProps {
  productId: string;
  productName: string | null;
  lessonTitle: string;
  moduleName: string | null;
  currentIndex: number;
  totalLessons: number;
  onOpenMobileMenu: () => void;
  showRating?: boolean;
}

export function LessonHeader({
  productId,
  productName,
  lessonTitle,
  moduleName,
  currentIndex,
  totalLessons,
  onOpenMobileMenu,
  showRating = true,
}: LessonHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Back Button */}
        <Link to={`/minha-conta/produto/${productId}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline truncate max-w-[150px]">
              {productName || "Voltar"}
            </span>
          </Button>
        </Link>

        {/* Current Lesson Info - Desktop */}
        <div className="hidden md:flex items-center gap-4 flex-1 px-4 justify-center">
          <div className="text-center">
            <p className="text-sm font-medium truncate max-w-[300px]">{lessonTitle}</p>
            <p className="text-xs text-muted-foreground">
              {moduleName} • Aula {currentIndex + 1} de {totalLessons}
            </p>
          </div>
        </div>

        {/* Rating - Desktop Only */}
        {showRating && (
          <div className="hidden lg:block">
            <LessonRating initialRating={0} onRate={() => {}} />
          </div>
        )}

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMobileMenu}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
