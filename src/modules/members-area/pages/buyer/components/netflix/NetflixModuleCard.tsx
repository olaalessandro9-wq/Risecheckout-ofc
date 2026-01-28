/**
 * Netflix-style Module Card Component
 * Displays a module with thumbnail, title, and lesson count
 * Uses SSOT card sizes from cardSizes.ts
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { motion } from "framer-motion";
import { PlayCircle, Film } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Module } from "../types";
import type { CardSize } from "@/modules/members-area-builder/constants/cardSizes";
import { getCardWidthClass } from "@/modules/members-area-builder/constants/cardSizes";

interface NetflixModuleCardProps {
  module: Module;
  index: number;
  onClick?: () => void;
  cardSize?: CardSize;
}

export function NetflixModuleCard({ module, index, onClick, cardSize = 'medium' }: NetflixModuleCardProps) {
  const lessonCount = module.contents.length;
  
  // RISE V3: Use SSOT card width from settings
  const cardWidth = getCardWidthClass(cardSize, false); // Mobile handled at parent level
  
  // Fallback gradient colors for modules without cover
  const gradientColors = [
    "from-rose-600 to-purple-700",
    "from-blue-600 to-cyan-500",
    "from-green-600 to-emerald-500",
    "from-orange-600 to-amber-500",
    "from-indigo-600 to-violet-500",
    "from-pink-600 to-fuchsia-500",
  ];
  const gradient = gradientColors[index % gradientColors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      onClick={onClick}
      className={cn("relative group/card cursor-pointer flex-shrink-0", cardWidth)}
    >
      {/* Card Container - Fixed aspect ratio 2:3 (poster style) */}
      <motion.div 
        whileHover={{ scale: 1.05, zIndex: 10 }}
        whileTap={{ scale: 0.98 }}
        className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg transition-shadow duration-300 group-hover/card:shadow-2xl ring-1 ring-white/10"
        style={{ '--tw-shadow-color': 'hsl(var(--members-primary) / 0.2)' } as React.CSSProperties}
      >
        {/* Background Image or Gradient Fallback */}
        {module.cover_image_url ? (
          <img
            src={module.cover_image_url}
            alt={module.title}
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Film className="h-16 w-16 text-white/30" />
            </div>
          </div>
        )}

        {/* Gradient overlay for better readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/40 transition-all duration-300 flex items-center justify-center">
          <PlayCircle className="h-14 w-14 text-white opacity-0 group-hover/card:opacity-100 transition-all duration-300 transform scale-75 group-hover/card:scale-100" />
        </div>

        {/* Badge with lesson count */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-black/70 text-white border-0 backdrop-blur-sm text-xs font-semibold">
            {lessonCount} {lessonCount === 1 ? "aula" : "aulas"}
          </Badge>
        </div>
      </motion.div>

      {/* Title below card */}
      <div className="mt-3 space-y-1">
        <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover/card:text-members-primary transition-colors">
          {module.title}
        </h3>
        {module.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {module.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
