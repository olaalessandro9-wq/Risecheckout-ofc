/**
 * LessonHeader - Minimal sticky header with back button
 * Clean, professional design
 */

import { Link } from "react-router-dom";
import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between h-12 px-3 md:px-4">
        {/* Back Button */}
        <Link to={`/minha-conta/produto/${productId}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2 md:px-3">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline text-sm truncate max-w-[120px]">
              {productName || "Voltar"}
            </span>
          </Button>
        </Link>

        {/* Current Lesson Info - Desktop Only (Minimal) */}
        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
          <span className="truncate max-w-[200px]">{moduleName}</span>
          <span className="mx-1">•</span>
          <span>{currentIndex + 1}/{totalLessons}</span>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden h-8 w-8 p-0"
          onClick={onOpenMobileMenu}
        >
          <Menu className="h-4 w-4" />
        </Button>
        
        {/* Spacer for desktop */}
        <div className="hidden lg:block w-20" />
      </div>
    </header>
  );
}
