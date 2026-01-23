/**
 * CaktoStyleSidebar - Right sidebar with expandable modules
 * Cakto/Kiwify-style navigation
 */

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModuleItem } from "./ModuleItem";
import type { Module, ContentItem } from "../types";

interface CaktoStyleSidebarProps {
  modules: Module[];
  currentModuleId: string | null;
  currentContentId: string | null;
  onSelectContent: (content: ContentItem, module: Module) => void;
  completedContentIds?: string[];
}

export function CaktoStyleSidebar({
  modules,
  currentModuleId,
  currentContentId,
  onSelectContent,
  completedContentIds = [],
}: CaktoStyleSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>(() => {
    // Start with current module expanded, or first module
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
    <aside className="w-80 border-l border-border bg-card/50 backdrop-blur-sm hidden lg:flex flex-col">
      {/* Progress Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Seu Progresso
          </span>
          <span className="text-sm font-semibold text-primary">
            {progressPercent}%
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {completedCount} de {totalContents} aulas concluídas
        </p>
      </div>

      {/* Modules List */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {modules.map((module, moduleIndex) => (
            <ModuleItem
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
