/**
 * Netflix-style Hero Banner Component
 * Displays the course cover with gradient overlay and title
 */

import { motion } from "framer-motion";
import { Play, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductData, Module } from "../types";

interface HeroBannerProps {
  product: ProductData | null;
  modules: Module[];
  onStartCourse?: () => void;
}

export function HeroBanner({ product, modules, onStartCourse }: HeroBannerProps) {
  if (!product) return null;

  // Get cover from settings or fallback to product image
  const coverUrl = 
    (product.settings?.cover_url as string) || 
    product.imageUrl || 
    null;

  // Calculate total lessons
  const totalLessons = modules.reduce((acc, m) => acc + m.contents.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative w-full h-[40vh] md:h-[50vh] lg:h-[60vh] overflow-hidden"
    >
      {/* Background Image */}
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
      )}

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="max-w-2xl space-y-4"
        >
          {/* Course Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground drop-shadow-lg">
            {product.name}
          </h1>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {modules.length} {modules.length === 1 ? "módulo" : "módulos"}
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span>{totalLessons} {totalLessons === 1 ? "aula" : "aulas"}</span>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm md:text-base text-muted-foreground line-clamp-2 max-w-lg">
              {product.description}
            </p>
          )}

          {/* Start Button */}
          {onStartCourse && (
            <Button 
              size="lg" 
              onClick={onStartCourse}
              className="gap-2 mt-2"
            >
              <Play className="h-5 w-5" />
              Começar a Assistir
            </Button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
