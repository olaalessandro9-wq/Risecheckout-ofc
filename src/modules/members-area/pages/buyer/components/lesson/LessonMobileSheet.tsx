/**
 * LessonMobileSheet - Premium mobile sheet for course navigation
 * Matches the desktop premium sidebar design
 */

import { useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PremiumModuleCard } from "./PremiumModuleCard";
import type { Module, ContentItem } from "../types";

interface LessonMobileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules: Module[];
  currentModuleId: string | null;
  currentContentId: string | null;
  onSelectContent: (content: ContentItem, module: Module) => void;
  completedContentIds?: string[];
  productName?: string;
}

export function LessonMobileSheet({
  open,
  onOpenChange,
  modules,
  currentModuleId,
  currentContentId,
  onSelectContent,
  completedContentIds = [],
  productName,
}: LessonMobileSheetProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>(() => {
    if (currentModuleId) return [currentModuleId];
    if (modules.length > 0) return [modules[0].id];
    return [];
  });

  // Auto-expand current module
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
    onOpenChange(false);
  };

  // Calculate progress
  const totalContents = modules.reduce((acc, m) => acc + m.contents.length, 0);
  const completedCount = completedContentIds.length;
  const progressPercent =
    totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[320px] sm:w-[380px] p-0">
        <SheetHeader className="p-4 pb-3 border-b border-border/50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-sm font-semibold truncate text-left">
                {productName || "Navegação"}
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {completedCount}/{totalContents} aulas • {progressPercent}%
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 h-1 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)]">
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
                onSelectContent={handleSelectContent}
              />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
