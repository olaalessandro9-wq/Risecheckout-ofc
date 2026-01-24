/**
 * PremiumSidebar - Premium sidebar with timeline visual
 * RiseCheckout exclusive design - Superior to Cakto
 * 
 * Features:
 * - Elegant timeline with gradient connector
 * - Smooth micro-interactions
 * - Premium progress indicators
 * - Glassmorphism effects
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PremiumModuleItem } from "./PremiumModuleItem";
import type { Module, ContentItem } from "../../types";
import { cn } from "@/lib/utils";

interface PremiumSidebarProps {
  modules: Module[];
  currentModuleId: string | null;
  currentContentId: string | null;
  onSelectContent: (content: ContentItem, module: Module) => void;
  completedContentIds?: string[];
  productName?: string;
}

export function PremiumSidebar({
  modules,
  currentModuleId,
  currentContentId,
  onSelectContent,
  completedContentIds = [],
  productName,
}: PremiumSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>(() => {
    if (currentModuleId) return [currentModuleId];
    if (modules.length > 0) return [modules[0].id];
    return [];
  });

  // Auto-expand current module when it changes
  useEffect(() => {
    if (currentModuleId && !expandedModules.includes(currentModuleId)) {
      setExpandedModules((prev) => [...prev, currentModuleId]);
    }
  }, [currentModuleId]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Calculate overall progress
  const totalContents = modules.reduce((acc, m) => acc + m.contents.length, 0);
  const completedCount = completedContentIds.length;
  const progressPercent =
    totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0;

  // Calculate progress ring values
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <aside className="w-[340px] border-l border-border/50 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-xl hidden lg:flex flex-col">
      {/* Premium Progress Header */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center gap-5">
          {/* Circular Progress Ring */}
          <div className="relative flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-muted/20"
              />
              {/* Progress circle with gradient */}
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{
                  strokeDasharray: circumference,
                }}
              />
              {/* Gradient definition */}
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="50%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#D946EF" />
                </linearGradient>
              </defs>
            </svg>
            {/* Percentage in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span 
                className="text-lg font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {progressPercent}%
              </motion.span>
            </div>
          </div>

          {/* Progress Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Seu Progresso
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {completedCount} de {totalContents} aulas concluídas
            </p>
            {/* Mini progress bar */}
            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modules List with Timeline */}
      <ScrollArea className="flex-1">
        <div className="p-4 relative">
          {/* Timeline connector line */}
          <div className="absolute left-[30px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-violet-500/50 via-purple-500/30 to-transparent rounded-full" />
          
          {modules.map((module, moduleIndex) => (
            <PremiumModuleItem
              key={module.id}
              module={module}
              moduleIndex={moduleIndex}
              isExpanded={expandedModules.includes(module.id)}
              isCurrentModule={currentModuleId === module.id}
              currentContentId={currentContentId}
              completedContentIds={completedContentIds}
              onToggle={() => toggleModule(module.id)}
              onSelectContent={onSelectContent}
              isLast={moduleIndex === modules.length - 1}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Footer with branding */}
      <div className="p-4 border-t border-border/30">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
          <span>Powered by</span>
          <span className="font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            RiseCheckout
          </span>
        </div>
      </div>
    </aside>
  );
}
