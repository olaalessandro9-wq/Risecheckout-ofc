/**
 * Netflix-style Module Carousel Component
 * Horizontal scrolling carousel of module cards
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NetflixModuleCard } from "./NetflixModuleCard";
import type { Module, ContentItem } from "../types";
import type { CardSize } from "@/modules/members-area-builder/constants/cardSizes";
import { getTitleSizeClass, type TitleSize } from "@/modules/members-area-builder/constants/titleSizes";
import { useIsMobile } from "@/hooks/use-mobile";

interface ModuleCarouselProps {
  modules: Module[];
  onSelectContent: (content: ContentItem, module: Module) => void;
  title?: string | null;
  cardSize?: CardSize;
  titleSize?: TitleSize;
  showTitle?: 'always' | 'hover' | 'never';
}

export function ModuleCarousel({ 
  modules, 
  onSelectContent, 
  title, 
  cardSize = 'medium', 
  titleSize = 'medium',
  showTitle = 'always'
}: ModuleCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const isMobile = useIsMobile();

  // RISE V3: Use SSOT title size from settings
  const titleSizeClass = getTitleSizeClass(titleSize, isMobile);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 320; // Card width + gap
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleModuleClick = (module: Module) => {
    // Navigate to first content of the module
    if (module.contents.length > 0) {
      onSelectContent(module.contents[0], module);
    }
  };

  if (modules.length === 0) {
    return (
      <div className="px-6 md:px-10 lg:px-16 py-8">
        <p className="text-muted-foreground text-center">
          Nenhum módulo disponível ainda.
        </p>
      </div>
    );
  }

  return (
    // RISE V3: bg-background explícito garante continuidade de superfície
    <div className="relative pt-3 pb-1 bg-background">
      {/* Section Title - Uses configurable title size */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="px-6 md:px-10 lg:px-16 mb-1"
      >
        <h2 className={cn(titleSizeClass, 'text-foreground')}>
          {title || "Módulos"}
        </h2>
      </motion.div>

      {/* Carousel Container */}
      <div className="relative group/carousel">
        {/* Left Arrow */}
        {showLeftArrow && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        {/* Right Arrow */}
        {showRightArrow && modules.length > 3 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-6 md:px-10 lg:px-16 pt-1.5 pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {modules.map((module, index) => (
            <NetflixModuleCard
              key={module.id}
              module={module}
              index={index}
              onClick={() => handleModuleClick(module)}
              cardSize={cardSize}
              showTitle={showTitle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
