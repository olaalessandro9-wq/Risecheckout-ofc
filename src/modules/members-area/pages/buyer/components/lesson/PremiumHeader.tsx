/**
 * PremiumHeader - Premium header for lesson viewer
 * RiseCheckout exclusive design
 * 
 * Features:
 * - Glassmorphism effect
 * - Gradient accents
 * - Rich lesson info
 * - Action buttons
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Menu, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonRating } from "./LessonRating";
import { cn } from "@/lib/utils";

interface PremiumHeaderProps {
  productId: string;
  productName: string | null;
  lessonTitle: string;
  moduleName: string | null;
  currentIndex: number;
  totalLessons: number;
  onOpenMobileMenu: () => void;
  showRating?: boolean;
}

export function PremiumHeader({
  productId,
  productName,
  lessonTitle,
  moduleName,
  currentIndex,
  totalLessons,
  onOpenMobileMenu,
  showRating = true,
}: PremiumHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section - Back Button & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link to={`/minha-conta/produto/${productId}`}>
            <motion.div
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            </motion.div>
          </Link>

          {/* Breadcrumb - Desktop */}
          <div className="hidden md:flex items-center gap-2 text-sm min-w-0">
            <span className="text-muted-foreground truncate max-w-[150px]">
              {productName || "Curso"}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
            <span className="text-muted-foreground truncate max-w-[120px]">
              {moduleName || "Módulo"}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
            <span className="font-medium text-foreground truncate max-w-[180px]">
              {lessonTitle}
            </span>
          </div>
        </div>

        {/* Center Section - Lesson Counter */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/30 border border-border/50">
            <span className="text-xs text-muted-foreground">Aula</span>
            <span className="text-sm font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              {currentIndex + 1}
            </span>
            <span className="text-xs text-muted-foreground">de {totalLessons}</span>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Rating - Desktop Only */}
          {showRating && (
            <div className="hidden lg:block mr-2">
              <LessonRating initialRating={0} onRate={() => {}} />
            </div>
          )}

          {/* Action Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className="lg:hidden"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl bg-muted/30 hover:bg-muted/50"
              onClick={onOpenMobileMenu}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Mobile Lesson Title Bar */}
      <div className="md:hidden px-4 pb-3">
        <p className="text-sm font-medium text-foreground truncate">{lessonTitle}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {moduleName} • Aula {currentIndex + 1} de {totalLessons}
        </p>
      </div>
    </header>
  );
}
