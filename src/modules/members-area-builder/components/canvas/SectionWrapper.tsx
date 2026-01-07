/**
 * Section Wrapper - Container com controles de seção
 * Envolve cada seção no canvas com controles de edição
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  ChevronUp, 
  ChevronDown, 
  Settings, 
  Copy, 
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getSectionLabel, getSectionIcon } from '../../registry';
import type { Section } from '../../types/builder.types';
import * as Icons from 'lucide-react';

interface SectionWrapperProps {
  section: Section;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  isPreviewMode: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  children: React.ReactNode;
}

export function SectionWrapper({
  section,
  isSelected,
  isFirst,
  isLast,
  isPreviewMode,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onToggleActive,
  children,
}: SectionWrapperProps) {
  const iconName = getSectionIcon(section.type);
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName] || Icons.Box;
  
  if (isPreviewMode) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        'group relative border-2 rounded-lg transition-all duration-200',
        isSelected 
          ? 'border-primary ring-2 ring-primary/20' 
          : 'border-transparent hover:border-muted-foreground/30',
        !section.is_active && 'opacity-50'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Section Header */}
      <div 
        className={cn(
          'absolute -top-3 left-4 flex items-center gap-2 px-2 py-0.5 rounded-md text-xs font-medium transition-opacity',
          'bg-background border',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab" />
        <IconComponent className="h-3 w-3" />
        <span>{getSectionLabel(section.type)}</span>
        {section.title && (
          <span className="text-muted-foreground">• {section.title}</span>
        )}
      </div>

      {/* Section Controls */}
      <div 
        className={cn(
          'absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        <div className="flex flex-col gap-0.5 bg-background border rounded-md shadow-sm p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={isFirst}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={isLast}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex flex-col gap-0.5 bg-background border rounded-md shadow-sm p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
          >
            {section.is_active ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Section Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
