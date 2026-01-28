/**
 * Netflix-style Module Carousel Component
 * Horizontal scrolling carousel of module cards
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NetflixModuleCard } from "./NetflixModuleCard";
import type { Module, ContentItem } from "../types";
import type { CardSize } from "@/modules/members-area-builder/constants/cardSizes";

interface ModuleCarouselProps {
  modules: Module[];
  onSelectContent: (content: ContentItem, module: Module) => void;
  title?: string | null;
  cardSize?: CardSize;
}

export function ModuleCarousel({ modules, onSelectContent, title, cardSize = 'medium' }: ModuleCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

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
    <div className="relative py-6">
      {/* Section Title */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="px-6 md:px-10 lg:px-16 mb-2"
      >
        <h2 className="text-xl md:text-2xl font-semibold text-foreground">
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
          className="flex gap-4 overflow-x-auto scrollbar-hide px-6 md:px-10 lg:px-16 pt-4 pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {modules.map((module, index) => (
            <NetflixModuleCard
              key={module.id}
              module={module}
              index={index}
              onClick={() => handleModuleClick(module)}
              cardSize={cardSize}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
