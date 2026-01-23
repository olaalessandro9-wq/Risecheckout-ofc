/**
 * ModuleItem - Expandable module in the sidebar
 * Cakto-style with +/- toggle and progress indicator
 */

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentItem as ContentItemComponent } from "./ContentItem";
import type { Module, ContentItem } from "../types";

interface ModuleItemProps {
  module: Module;
  moduleIndex: number;
  isExpanded: boolean;
  isCurrentModule: boolean;
  currentContentId: string | null;
  completedContentIds: string[];
  onToggle: () => void;
  onSelectContent: (content: ContentItem, module: Module) => void;
}

export function ModuleItem({
  module,
  moduleIndex,
  isExpanded,
  isCurrentModule,
  currentContentId,
  completedContentIds,
  onToggle,
  onSelectContent,
}: ModuleItemProps) {
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

  // Determine status icon
  const getStatusIcon = () => {
    if (moduleCompleted) {
      return (
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="h-3.5 w-3.5 text-white" />
        </div>
      );
    }
    if (completedCount > 0) {
      // In progress - half circle visual
      return (
        <div className="w-6 h-6 rounded-full border-2 border-primary relative overflow-hidden">
          <div
            className="absolute bottom-0 left-0 right-0 bg-primary/30"
            style={{ height: `${progressPercent}%` }}
          />
        </div>
      );
    }
    // Not started - empty circle
    return (
      <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
    );
  };

  return (
    <div className="mb-1">
      {/* Module Header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
          isCurrentModule
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted"
        )}
      >
        {/* Status Icon */}
        {getStatusIcon()}

        {/* Module Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium truncate">{module.title}</h4>
          <p className="text-xs text-muted-foreground">
            {module.contents.length} aulas • {progressPercent}%
          </p>
        </div>

        {/* Expand/Collapse Icon - Cakto style (+/-) */}
        <div
          className={cn(
            "w-6 h-6 rounded flex items-center justify-center text-xs font-medium transition-colors",
            isExpanded
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isExpanded ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </div>
      </button>

      {/* Contents List */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-4 pl-4 border-l-2 border-border/50"
          >
            {module.contents.map((content, contentIndex) => (
              <ContentItemComponent
                key={content.id}
                content={content}
                contentIndex={contentIndex}
                isActive={currentContentId === content.id}
                isCompleted={completedContentIds.includes(content.id)}
                onClick={() => onSelectContent(content, module)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
