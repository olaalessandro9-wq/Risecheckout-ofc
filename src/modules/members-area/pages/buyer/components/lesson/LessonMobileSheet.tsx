/**
 * LessonMobileSheet - Mobile navigation sheet with modules
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModuleItem } from "./ModuleItem";
import type { Module, ContentItem } from "../types";
import { useState, useEffect } from "react";

interface LessonMobileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules: Module[];
  currentModuleId: string | null;
  currentContentId: string | null;
  onSelectContent: (content: ContentItem, module: Module) => void;
  completedContentIds?: string[];
}

export function LessonMobileSheet({
  open,
  onOpenChange,
  modules,
  currentModuleId,
  currentContentId,
  onSelectContent,
  completedContentIds = [],
}: LessonMobileSheetProps) {
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

  const handleSelectContent = (content: ContentItem, module: Module) => {
    onSelectContent(content, module);
    onOpenChange(false); // Close sheet after selection
  };

  // Calculate overall progress
  const totalContents = modules.reduce((acc, m) => acc + m.contents.length, 0);
  const completedCount = completedContentIds.length;
  const progressPercent =
    totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-sm p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle>Navegação do Curso</SheetTitle>
        </SheetHeader>

        {/* Progress Section */}
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Seu Progresso</span>
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
        <ScrollArea className="h-[calc(100vh-180px)]">
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
                onSelectContent={handleSelectContent}
              />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
