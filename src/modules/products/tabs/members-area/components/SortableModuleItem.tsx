/**
 * SortableModuleItem - Individual draggable module with contents
 * Single Responsibility: Render and handle drag for a single module
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2, Edit2, GripVertical } from "lucide-react";
import type { ModuleWithContents } from "@/modules/members-area/types";
import { ContentsList } from "./ContentsList";

// =====================================================
// TYPES
// =====================================================

export interface SortableModuleItemProps {
  module: ModuleWithContents;
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
}

// =====================================================
// COMPONENT
// =====================================================

export function SortableModuleItem({
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

  const contentsCount = (module.contents || []).length;

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
              {contentsCount} conteúdo{contentsCount !== 1 ? "s" : ""}
            </p>
          </div>
          {!module.is_active && <Badge variant="secondary">Inativo</Badge>}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pt-2">
          {/* Module Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onEditModule({
                  id: module.id,
                  title: module.title,
                  cover_image_url: module.cover_image_url || null,
                })
              }
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
