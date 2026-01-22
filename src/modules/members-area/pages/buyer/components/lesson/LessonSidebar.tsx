/**
 * Lesson Sidebar Component
 * Right-side navigation for lesson viewer (Cakto-style)
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Check, Play, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Module, ContentItem } from "../types";

interface LessonSidebarProps {
  modules: Module[];
  currentModuleId: string | null;
  currentContentId: string | null;
  onSelectContent: (content: ContentItem, module: Module) => void;
  completedContentIds?: string[];
}

export function LessonSidebar({
  modules,
  currentModuleId,
  currentContentId,
  onSelectContent,
  completedContentIds = [],
}: LessonSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>(
    currentModuleId ? [currentModuleId] : modules.length > 0 ? [modules[0].id] : []
  );

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
  const progressPercent = totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0;

  return (
    <aside className="w-80 border-l border-border bg-card/50 backdrop-blur-sm hidden lg:flex flex-col">
      {/* Progress Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Seu Progresso</span>
          <span className="text-sm text-muted-foreground">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {completedCount} de {totalContents} aulas concluídas
        </p>
      </div>

      {/* Modules List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules.includes(module.id);
            const moduleCompleted = module.contents.every((c) =>
              completedContentIds.includes(c.id)
            );
            const moduleProgress = module.contents.length > 0
              ? Math.round(
                  (module.contents.filter((c) => completedContentIds.includes(c.id)).length /
                    module.contents.length) *
                    100
                )
              : 0;

            return (
              <div key={module.id} className="mb-1">
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(module.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                    currentModuleId === module.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  {/* Module Number */}
                  <div
                    className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      moduleCompleted
                        ? "bg-green-500/20 text-green-500"
                        : currentModuleId === module.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {moduleCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      moduleIndex + 1
                    )}
                  </div>

                  {/* Module Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{module.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {module.contents.length} aulas • {moduleProgress}%
                    </p>
                  </div>

                  {/* Expand Icon */}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Contents List */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-4 pl-4 border-l border-border/50"
                  >
                    {module.contents.map((content, contentIndex) => {
                      const isActive = currentContentId === content.id;
                      const isCompleted = completedContentIds.includes(content.id);

                      return (
                        <button
                          key={content.id}
                          onClick={() => onSelectContent(content, module)}
                          className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-md text-left text-sm transition-all",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                        >
                          {/* Status Icon */}
                          <div
                            className={cn(
                              "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                              isCompleted
                                ? "bg-green-500/20 text-green-500"
                                : isActive
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {isCompleted ? (
                              <Check className="h-3 w-3" />
                            ) : isActive ? (
                              <Play className="h-3 w-3" />
                            ) : (
                              <span className="text-xs">{contentIndex + 1}</span>
                            )}
                          </div>

                          {/* Content Title */}
                          <span
                            className={cn(
                              "flex-1 truncate",
                              isActive
                                ? "text-primary-foreground"
                                : isCompleted
                                ? "text-muted-foreground"
                                : "text-foreground"
                            )}
                          >
                            {content.title}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
