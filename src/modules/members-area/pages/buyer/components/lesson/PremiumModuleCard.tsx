/**
 * PremiumModuleCard - Elegant module card for premium sidebar
 * Clean design with status dots and smooth animations
 */

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumContentItem } from "./PremiumContentItem";
import type { Module, ContentItem } from "../types";

interface PremiumModuleCardProps {
  module: Module;
  moduleIndex: number;
  isExpanded: boolean;
  isCurrentModule: boolean;
  currentContentId: string | null;
  completedContentIds: string[];
  onToggle: () => void;
  onSelectContent: (content: ContentItem, module: Module) => void;
}

export function PremiumModuleCard({
  module,
  moduleIndex,
  isExpanded,
  isCurrentModule,
  currentContentId,
  completedContentIds,
  onToggle,
  onSelectContent,
}: PremiumModuleCardProps) {
  const completedCount = module.contents.filter((c) =>
    completedContentIds.includes(c.id)
  ).length;
  const moduleCompleted = completedCount === module.contents.length && module.contents.length > 0;
  const hasProgress = completedCount > 0;

  // Status dot color
  const getStatusColor = () => {
    if (moduleCompleted) return "bg-emerald-500";
    if (hasProgress) return "bg-amber-500";
    return "bg-muted-foreground/30";
  };

  return (
    <div 
      className={cn(
        "rounded-xl transition-all duration-200",
        isCurrentModule && "bg-primary/5 ring-1 ring-primary/20"
      )}
    >
      {/* Module Header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
          !isCurrentModule && "hover:bg-muted/50"
        )}
      >
        {/* Status Dot */}
        <div className="relative flex-shrink-0">
          <div className={cn("w-2.5 h-2.5 rounded-full", getStatusColor())} />
          {moduleCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center"
            >
              <Check className="h-2 w-2 text-white" />
            </motion.div>
          )}
        </div>

        {/* Module Info */}
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "text-sm font-medium truncate",
            isCurrentModule ? "text-primary" : "text-foreground"
          )}>
            {module.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedCount}/{module.contents.length} aulas
          </p>
        </div>

        {/* Expand/Collapse Toggle */}
        <div
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors",
            isExpanded
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          {isExpanded ? (
            <Minus className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </div>
      </button>

      {/* Contents List */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-2 px-2 space-y-0.5">
              {module.contents.map((content) => (
                <PremiumContentItem
                  key={content.id}
                  content={content}
                  isActive={currentContentId === content.id}
                  isCompleted={completedContentIds.includes(content.id)}
                  onClick={() => onSelectContent(content, module)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
