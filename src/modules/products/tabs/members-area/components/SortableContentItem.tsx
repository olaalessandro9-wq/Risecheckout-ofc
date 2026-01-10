/**
 * SortableContentItem - Individual draggable content item
 * Single Responsibility: Render and handle drag for a single content item
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Edit2, Trash2 } from "lucide-react";
import type { MemberContent } from "@/hooks/members-area";
import { getContentIconComponent, getContentLabel } from "./modules-list.utils";

// =====================================================
// TYPES
// =====================================================

export interface SortableContentItemProps {
  content: MemberContent;
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

export function SortableContentItem({
  content,
  onEditContent,
  onDeleteContent,
}: SortableContentItemProps) {
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

  const IconComponent = getContentIconComponent(content.content_type);

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
          <IconComponent className="h-4 w-4" />
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
          onClick={() =>
            onEditContent({
              id: content.id,
              title: content.title,
              content_type: content.content_type,
              content_url: content.content_url,
              description: content.description,
            })
          }
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
