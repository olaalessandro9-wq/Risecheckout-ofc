/**
 * Sortable Section Tree Item - Item sortable da árvore de seções
 * Simplificado: apenas navegação, sem editor inline
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Trash2, 
  GripVertical,
  Image,
  LayoutGrid,
  BookOpen,
  Play,
  Type,
  Minus,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Section, SectionType } from '../../types';
import { canDeleteSection, canMoveSection, getSectionLabel } from '../../registry';

// Icon mapping for section types
const SECTION_ICONS: Record<SectionType, React.ComponentType<{ className?: string }>> = {
  fixed_header: LayoutDashboard,
  banner: Image,
  modules: LayoutGrid,
  courses: BookOpen,
  continue_watching: Play,
  text: Type,
  spacer: Minus,
};

interface SortableSectionTreeItemProps {
  section: Section;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SortableSectionTreeItem({
  section,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: SortableSectionTreeItemProps) {
  const Icon = SECTION_ICONS[section.type];
  const canDelete = canDeleteSection(section.type);
  const canMove = canMoveSection(section.type);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const sectionLabel = section.title || getSectionLabel(section.type);

  const handleClick = () => {
    onSelect();
    onEdit();
  };
  
  return (
    <div ref={setNodeRef} style={style} className="select-none group/tree-item">
      {/* Main section row */}
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-2.5 rounded-md cursor-pointer transition-colors',
          'hover:bg-accent/50',
          isSelected && 'bg-accent text-accent-foreground'
        )}
        onClick={handleClick}
      >
        {/* Drag handle - only if section can be moved */}
        {canMove ? (
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent/50 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : (
          <div className="p-1">
            <div className="h-4 w-4" /> {/* Spacer for alignment */}
          </div>
        )}
        
        {/* Section icon */}
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        
        {/* Section name */}
        <span className="flex-1 text-sm truncate">
          {sectionLabel}
        </span>
        
        {/* Inactive badge */}
        {!section.is_active && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            Inativo
          </span>
        )}
        
        {/* Delete button */}
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover/tree-item:opacity-100 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
        
        {/* Chevron to indicate navigation */}
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
}

