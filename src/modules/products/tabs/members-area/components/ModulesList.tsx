/**
 * ModulesList - Orchestrator for drag-and-drop module management
 * Single Responsibility: DndContext setup, sensors, and drag handlers
 * 
 * Architecture: Single DndContext with multiple SortableContexts
 * - One for modules (vertical list)
 * - One per module for its contents (vertical list)
 */

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { Plus, Lock } from "lucide-react";
import type { ModuleWithContents, MemberContent } from "@/modules/members-area/types";
import { SortableModuleItem } from "./SortableModuleItem";
import { MODULES_CONTAINER_ID } from "./modules-list.utils";

// =====================================================
// TYPES
// =====================================================

interface ModulesListProps {
  modules: ModuleWithContents[];
  onAddModule: () => void;
  onEditModule: (module: {
    id: string;
    title: string;
    cover_image_url: string | null;
  }) => void;
  onDeleteModule: (id: string) => void;
  onAddContent: (moduleId: string) => void;
  onEditContent: (content: {
    id: string;
    title: string;
    content_type: string;
    content_url: string | null;
    description: string | null;
  }) => void;
  onDeleteContent: (id: string) => void;
  onReorderModules: (orderedIds: string[]) => Promise<void>;
  onReorderContents: (moduleId: string, orderedIds: string[]) => Promise<void>;
}

// =====================================================
// COMPONENT
// =====================================================

export function ModulesList({
  modules,
  onAddModule,
  onEditModule,
  onDeleteModule,
  onAddContent,
  onEditContent,
  onDeleteContent,
  onReorderModules,
  onReorderContents,
}: ModulesListProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  // Single sensor configuration for the entire DndContext
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Deterministic lookup structures - avoids relying on containerId from dnd-kit data
  const moduleIdSet = useMemo(
    () => new Set(modules.map((m) => m.id)),
    [modules]
  );

  const contentToModuleMap = useMemo(() => {
    const map = new Map<string, string>();
    modules.forEach((m) => {
      (m.contents || []).forEach((c) => {
        map.set(c.id, m.id);
      });
    });
    return map;
  }, [modules]);

  // Unified drag end handler using deterministic maps
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Case 1: Both are modules - reorder modules
      if (moduleIdSet.has(activeId) && moduleIdSet.has(overId)) {
        const oldIndex = modules.findIndex((m) => m.id === activeId);
        const newIndex = modules.findIndex((m) => m.id === overId);

        if (oldIndex === -1 || newIndex === -1) return;

        const newOrder = arrayMove(modules, oldIndex, newIndex);
        await onReorderModules(newOrder.map((m) => m.id));
        return;
      }

      // Case 2: Both are contents in the SAME module - reorder contents
      const activeModuleId = contentToModuleMap.get(activeId);
      const overModuleId = contentToModuleMap.get(overId);

      if (activeModuleId && overModuleId && activeModuleId === overModuleId) {
        const module = modules.find((m) => m.id === activeModuleId);
        if (!module) return;

        const contents: MemberContent[] = module.contents || [];
        const oldIndex = contents.findIndex((c) => c.id === activeId);
        const newIndex = contents.findIndex((c) => c.id === overId);

        if (oldIndex === -1 || newIndex === -1) return;

        const newOrder = arrayMove(contents, oldIndex, newIndex);
        await onReorderContents(activeModuleId, newOrder.map((c) => c.id));
      }
    },
    [modules, moduleIdSet, contentToModuleMap, onReorderModules, onReorderContents]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Módulos</CardTitle>
            <CardDescription>Organize seu conteúdo em módulos</CardDescription>
          </div>
          <Button size="sm" onClick={onAddModule}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Módulo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {modules.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum módulo criado ainda</p>
            <p className="text-sm text-muted-foreground">
              Clique em "Novo Módulo" para começar
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              id={MODULES_CONTAINER_ID}
              items={modules.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <Accordion
                type="multiple"
                className="space-y-2"
                value={openItems}
                onValueChange={setOpenItems}
              >
                {modules.map((module) => (
                  <SortableModuleItem
                    key={module.id}
                    module={module}
                    onEditModule={onEditModule}
                    onDeleteModule={onDeleteModule}
                    onAddContent={onAddContent}
                    onEditContent={onEditContent}
                    onDeleteContent={onDeleteContent}
                  />
                ))}
              </Accordion>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
