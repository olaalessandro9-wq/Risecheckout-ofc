/**
 * SortableModuleListItem - Item de módulo arrastável para reordenação
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Extraído de ModulesEditor.tsx
 */

import { GripVertical, ImageIcon, Eye, EyeOff, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { MemberModule } from '../../../types';

interface SortableModuleListItemProps {
  module: MemberModule;
  isHidden: boolean;
  onEdit: () => void;
  onToggleVisibility: () => void;
}

export function SortableModuleListItem({ 
  module, 
  isHidden, 
  onEdit, 
  onToggleVisibility 
}: SortableModuleListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg border transition-colors group',
        isHidden ? 'opacity-50 bg-muted/50' : 'hover:bg-accent',
        !module.is_active && 'opacity-60'
      )}
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Thumbnail */}
      <div 
        className="w-10 h-14 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer"
        onClick={onEdit}
      >
        {module.cover_image_url ? (
          <img 
            src={module.cover_image_url} 
            alt={module.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <p className={cn('text-sm font-medium truncate', isHidden && 'line-through')}>
          {module.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {module.cover_image_url ? 'Com capa' : 'Sem capa'}
          {isHidden && ' • Oculto'}
        </p>
      </div>

      {/* Visibility Toggle */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="flex-shrink-0 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        title={isHidden ? 'Mostrar módulo' : 'Ocultar módulo'}
      >
        {isHidden ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>

      {/* Edit Button */}
      <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
}
