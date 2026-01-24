/**
 * PremiumSidebar - Cakto-style premium sidebar
 * Card-based modules with elegant status indicators
 */

import { useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PremiumModuleCard } from "./PremiumModuleCard";
import type { Module, ContentItem } from "../types";

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

  return (
    <aside className="w-80 lg:w-96 xl:w-[420px] shrink-0 border-l border-border/50 bg-card/30 hidden lg:flex flex-col">
      {/* Product Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">
              {productName || "Conteúdo do Curso"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completedCount}/{totalContents} aulas • {progressPercent}% concluído
            </p>
          </div>
        </div>
        
        {/* Minimal Progress Bar */}
        <div className="mt-3 h-1 bg-muted/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Modules List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1.5">
          {modules.map((module, moduleIndex) => (
            <PremiumModuleCard
              key={module.id}
              module={module}
              moduleIndex={moduleIndex}
              isExpanded={expandedModules.includes(module.id)}
              isCurrentModule={currentModuleId === module.id}
              currentContentId={currentContentId}
              completedContentIds={completedContentIds}
              onToggle={() => toggleModule(module.id)}
              onSelectContent={onSelectContent}
            />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
