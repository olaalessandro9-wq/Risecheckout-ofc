/**
 * ContentsList - List of sortable content items within a module
 * Single Responsibility: Render content list with SortableContext
 */

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { MemberContent } from "@/modules/members-area/types";
import { SortableContentItem } from "./SortableContentItem";
import { CONTENTS_CONTAINER_PREFIX } from "./modules-list.utils";

// =====================================================
// TYPES
// =====================================================

export interface ContentsListProps {
  moduleId: string;
  contents: MemberContent[];
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

export function ContentsList({
  moduleId,
  contents,
  onEditContent,
  onDeleteContent,
}: ContentsListProps) {
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
      items={contents.map((c) => c.id)}
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
