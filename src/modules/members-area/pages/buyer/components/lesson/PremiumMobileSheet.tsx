/**
 * PremiumMobileSheet - Premium mobile navigation sheet
 * RiseCheckout exclusive design
 * 
 * Features:
 * - Smooth slide-up animation
 * - Premium progress display
 * - Timeline-style module list
 */

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PremiumModuleItem } from "./PremiumModuleItem";
import type { Module, ContentItem } from "../../types";
import { useState, useEffect } from "react";

interface PremiumMobileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules: Module[];
  currentModuleId: string | null;
  currentContentId: string | null;
  onSelectContent: (content: ContentItem, module: Module) => void;
  completedContentIds?: string[];
  productName?: string;
}

export function PremiumMobileSheet({
  open,
  onOpenChange,
  modules,
  currentModuleId,
  currentContentId,
  onSelectContent,
  completedContentIds = [],
  productName,
}: PremiumMobileSheetProps) {
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

  const handleSelectContent = (content: ContentItem, module: Module) => {
    onSelectContent(content, module);
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => onOpenChange(false)}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 lg:hidden bg-background rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-muted" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 border-b border-border/50">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Conteúdo do Curso</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {completedCount} de {totalContents} aulas concluídas
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-9 w-9 rounded-xl"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="px-5 py-4 border-b border-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Seu Progresso</span>
                <span className="text-sm font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Modules List */}
            <ScrollArea className="flex-1 px-4 py-4">
              <div className="relative">
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
                    onSelectContent={handleSelectContent}
                    isLast={moduleIndex === modules.length - 1}
                  />
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
