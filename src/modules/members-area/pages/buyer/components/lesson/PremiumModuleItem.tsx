/**
 * PremiumModuleItem - Premium expandable module in the sidebar
 * RiseCheckout exclusive design with timeline integration
 * 
 * Features:
 * - Timeline node with status indicator
 * - Smooth expand/collapse animations
 * - Gradient accents
 * - Premium hover states
 */

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Play, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumContentItem } from "./PremiumContentItem";
import type { Module, ContentItem } from "../../types";

interface PremiumModuleItemProps {
  module: Module;
  moduleIndex: number;
  isExpanded: boolean;
  isCurrentModule: boolean;
  currentContentId: string | null;
  completedContentIds: string[];
  onToggle: () => void;
  onSelectContent: (content: ContentItem, module: Module) => void;
  isLast?: boolean;
}

export function PremiumModuleItem({
  module,
  moduleIndex,
  isExpanded,
  isCurrentModule,
  currentContentId,
  completedContentIds,
  onToggle,
  onSelectContent,
  isLast = false,
}: PremiumModuleItemProps) {
  const moduleCompleted = module.contents.every((c) =>
    completedContentIds.includes(c.id)
  );
  const completedCount = module.contents.filter((c) =>
    completedContentIds.includes(c.id)
  ).length;
  const progressPercent =
    module.contents.length > 0
      ? Math.round((completedCount / module.contents.length) * 100)
      : 0;
  const isInProgress = completedCount > 0 && !moduleCompleted;

  // Status node component
  const StatusNode = () => {
    if (moduleCompleted) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
        >
          <Check className="h-4 w-4 text-white" strokeWidth={3} />
        </motion.div>
      );
    }
    if (isCurrentModule || isInProgress) {
      return (
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30"
          >
            <Play className="h-3.5 w-3.5 text-white ml-0.5" fill="white" />
          </motion.div>
          {/* Pulse ring */}
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-violet-500"
          />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30 bg-background flex items-center justify-center">
        <span className="text-xs font-semibold text-muted-foreground">
          {moduleIndex + 1}
        </span>
      </div>
    );
  };

  return (
    <div className={cn("relative", !isLast && "mb-2")}>
      {/* Module Header */}
      <motion.button
        onClick={onToggle}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full flex items-center gap-4 p-3 rounded-xl text-left transition-all duration-200",
          isCurrentModule
            ? "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20"
            : "hover:bg-muted/50"
        )}
      >
        {/* Timeline Node */}
        <div className="relative z-10 flex-shrink-0">
          <StatusNode />
        </div>

        {/* Module Info */}
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "text-sm font-semibold truncate transition-colors",
            isCurrentModule 
              ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent"
              : "text-foreground"
          )}>
            {module.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {module.contents.length} {module.contents.length === 1 ? 'aula' : 'aulas'}
            </span>
            {progressPercent > 0 && (
              <>
                <span className="text-muted-foreground/30">•</span>
                <span className={cn(
                  "text-xs font-medium",
                  moduleCompleted ? "text-emerald-500" : "text-violet-500"
                )}>
                  {progressPercent}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Expand/Collapse Icon */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
            isExpanded
              ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </motion.button>

      {/* Contents List */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-[18px] pl-6 border-l-2 border-violet-500/20 mt-1 space-y-1">
              {module.contents.map((content, contentIndex) => (
                <PremiumContentItem
                  key={content.id}
                  content={content}
                  contentIndex={contentIndex}
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
