/**
 * ModulesList - Lista de módulos com drag-and-drop
 * Uses unified content type system
 * 
 * Architecture: Single DndContext with multiple SortableContexts (one for modules, one per content list)
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
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, Edit2, GripVertical, Lock, Layers, Video, FileText } from "lucide-react";
import type { MemberModuleWithContents, MemberContent } from "@/hooks/members-area";

// =====================================================
// TYPES
// =====================================================

interface ModulesListProps {
  modules: MemberModuleWithContents[];
  onAddModule: () => void;
  onEditModule: (module: { id: string; title: string; cover_image_url: string | null }) => void;
  onDeleteModule: (id: string) => void;
  onAddContent: (moduleId: string) => void;
  onEditContent: (content: { id: string; title: string; content_type: string; content_url: string | null; description: string | null }) => void;
  onDeleteContent: (id: string) => void;
  onReorderModules: (orderedIds: string[]) => Promise<void>;
  onReorderContents: (moduleId: string, orderedIds: string[]) => Promise<void>;
}

// =====================================================
// UTILS
// =====================================================

/** Get icon for content type */
function getContentIcon(type: string) {
  switch (type) {
    case 'video':
      return <Video className="h-4 w-4" />;
    case 'text':
      return <FileText className="h-4 w-4" />;
    case 'mixed':
    default:
      return <Layers className="h-4 w-4" />;
  }
}

/** Get label for content type */
function getContentLabel(type: string): string {
  switch (type) {
    case 'video':
      return 'Vídeo';
    case 'text':
      return 'Texto';
    case 'mixed':
    default:
      return 'Conteúdo';
  }
}

// Container ID prefixes for distinguishing module vs content drag
const MODULES_CONTAINER_ID = "modules";
const CONTENTS_CONTAINER_PREFIX = "contents:";

// =====================================================
// SORTABLE CONTENT ITEM
// =====================================================

interface SortableContentItemProps {
  content: MemberContent;
  onEditContent: (content: { id: string; title: string; content_type: string; content_url: string | null; description: string | null }) => void;
  onDeleteContent: (id: string) => void;
}

function SortableContentItem({ content, onEditContent, onDeleteContent }: SortableContentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: content.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle - using span to avoid nested button issues */}
        <span
          ref={setActivatorNodeRef}
          className="touch-none cursor-grab active:cursor-grabbing p-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </span>
        <div className="p-1.5 rounded bg-background">
          {getContentIcon(content.content_type)}
        </div>
        <div>
          <p className="text-sm font-medium">{content.title}</p>
          <p className="text-xs text-muted-foreground">
            {getContentLabel(content.content_type)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => onEditContent({
            id: content.id,
            title: content.title,
            content_type: content.content_type,
            content_url: content.content_url,
            description: content.description,
          })}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDeleteContent(content.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// =====================================================
// CONTENTS LIST (Simple renderer, no DndContext)
// =====================================================

interface ContentsListProps {
  moduleId: string;
  contents: MemberContent[];
  onEditContent: (content: { id: string; title: string; content_type: string; content_url: string | null; description: string | null }) => void;
  onDeleteContent: (id: string) => void;
}

function ContentsList({ moduleId, contents, onEditContent, onDeleteContent }: ContentsListProps) {
  if (contents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Nenhum conteúdo neste módulo
      </p>
    );
  }

  return (
    <SortableContext
      id={`${CONTENTS_CONTAINER_PREFIX}${moduleId}`}
      items={contents.map(c => c.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className="space-y-2">
        {contents.map((content) => (
          <SortableContentItem
            key={content.id}
            content={content}
            onEditContent={onEditContent}
            onDeleteContent={onDeleteContent}
          />
        ))}
      </div>
    </SortableContext>
  );
}

// =====================================================
// SORTABLE MODULE ITEM
// =====================================================

interface SortableModuleItemProps {
  module: MemberModuleWithContents;
  onEditModule: (module: { id: string; title: string; cover_image_url: string | null }) => void;
  onDeleteModule: (id: string) => void;
  onAddContent: (moduleId: string) => void;
  onEditContent: (content: { id: string; title: string; content_type: string; content_url: string | null; description: string | null }) => void;
  onDeleteContent: (id: string) => void;
}

function SortableModuleItem({
  module,
  onEditModule,
  onDeleteModule,
  onAddContent,
  onEditContent,
  onDeleteContent,
}: SortableModuleItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <AccordionItem
      ref={setNodeRef}
      style={style}
      value={module.id}
      className="border rounded-lg px-4"
    >
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 flex-1">
          {/* 
            Drag Handle - using <span> instead of <button> to avoid nested buttons
            (AccordionTrigger is already a button).
            onClickCapture prevents accordion toggle when clicking the handle,
            but does NOT block pointer/mouse down which dnd-kit needs to initiate drag.
          */}
          <span
            ref={setActivatorNodeRef}
            className="touch-none cursor-grab active:cursor-grabbing p-1"
            {...attributes}
            {...listeners}
            onClickCapture={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </span>
          <div className="text-left">
            <p className="font-medium">{module.title}</p>
            <p className="text-xs text-muted-foreground">
              {(module.contents || []).length} conteúdo{(module.contents || []).length !== 1 ? "s" : ""}
            </p>
          </div>
          {!module.is_active && (
            <Badge variant="secondary">Inativo</Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pt-2">
          {/* Module Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditModule({
                id: module.id,
                title: module.title,
                cover_image_url: module.cover_image_url || null,
              })}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddContent(module.id)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Conteúdo
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => onDeleteModule(module.id)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Excluir
            </Button>
          </div>

          <Separator />

          {/* Contents List - SortableContext is inside ContentsList */}
          <ContentsList
            moduleId={module.id}
            contents={module.contents}
            onEditContent={onEditContent}
            onDeleteContent={onDeleteContent}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// =====================================================
// MAIN COMPONENT
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
  const moduleIdSet = useMemo(() => new Set(modules.map(m => m.id)), [modules]);
  
  const contentToModuleMap = useMemo(() => {
    const map = new Map<string, string>();
    modules.forEach(m => {
      (m.contents || []).forEach(c => {
        map.set(c.id, m.id);
      });
    });
    return map;
  }, [modules]);


  // Unified drag end handler using deterministic maps (not relying on containerId)
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Case 1: Both are modules
    if (moduleIdSet.has(activeId) && moduleIdSet.has(overId)) {
      const oldIndex = modules.findIndex(m => m.id === activeId);
      const newIndex = modules.findIndex(m => m.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(modules, oldIndex, newIndex);
      await onReorderModules(newOrder.map(m => m.id));
      return;
    }

    // Case 2: Both are contents in the SAME module
    const activeModuleId = contentToModuleMap.get(activeId);
    const overModuleId = contentToModuleMap.get(overId);

    if (activeModuleId && overModuleId && activeModuleId === overModuleId) {
      const module = modules.find(m => m.id === activeModuleId);
      if (!module) return;

      const contents = module.contents || [];
      const oldIndex = contents.findIndex(c => c.id === activeId);
      const newIndex = contents.findIndex(c => c.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(contents, oldIndex, newIndex);
      await onReorderContents(activeModuleId, newOrder.map(c => c.id));
    }
  }, [modules, moduleIdSet, contentToModuleMap, onReorderModules, onReorderContents]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Módulos</CardTitle>
            <CardDescription>
              Organize seu conteúdo em módulos
            </CardDescription>
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
          /* Single DndContext for both modules and contents */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              id={MODULES_CONTAINER_ID}
              items={modules.map(m => m.id)}
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
