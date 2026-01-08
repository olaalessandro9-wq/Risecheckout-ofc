/**
 * Section Tree Item - Item individual da árvore de seções
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  GripVertical,
  Image,
  LayoutGrid,
  BookOpen,
  Play,
  Type,
  Minus,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Section, SectionType, BannerSettings, MemberModule } from '../../types/builder.types';
import { canDeleteSection } from '../../registry';

// Icon mapping for section types
const SECTION_ICONS: Record<SectionType, React.ComponentType<{ className?: string }>> = {
  banner: Image,
  modules: LayoutGrid,
  courses: BookOpen,
  continue_watching: Play,
  text: Type,
  spacer: Minus,
};

interface SectionTreeItemProps {
  section: Section;
  isSelected: boolean;
  modules?: MemberModule[];
  onSelect: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function SectionTreeItem({
  section,
  isSelected,
  modules,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: SectionTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = SECTION_ICONS[section.type];
  const canDelete = canDeleteSection(section.type);
  
  // Get subitems based on section type
  const getSubitems = () => {
    switch (section.type) {
      case 'banner': {
        const bannerSettings = section.settings as BannerSettings;
        return bannerSettings.slides.map((slide, i) => ({
          id: slide.id,
          label: `Slide ${i + 1}`,
          type: 'slide' as const,
        }));
      }
      case 'modules': {
        if (!modules) return [];
        return modules.map(m => ({
          id: m.id,
          label: m.title,
          type: 'module' as const,
        }));
      }
      default:
        return [];
    }
  };
  
  const subitems = getSubitems();
  const hasSubitems = subitems.length > 0 || section.type === 'banner' || section.type === 'modules';
  
  const sectionLabel = section.title || getSectionLabel(section.type);
  
  return (
    <div className="select-none">
      {/* Main section row */}
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
          'hover:bg-accent/50',
          isSelected && 'bg-accent text-accent-foreground'
        )}
        onClick={onSelect}
      >
        {/* Drag handle */}
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-50 cursor-grab" />
        
        {/* Expand/collapse chevron */}
        {hasSubitems ? (
          <button
            className="p-0.5 hover:bg-accent rounded"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <div className="w-5" /> // Spacer for alignment
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
      </div>
      
      {/* Subitems */}
      {isExpanded && hasSubitems && (
        <div className="ml-6 border-l border-border pl-2 mt-1 space-y-0.5">
          {subitems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer rounded hover:bg-accent/30"
            >
              <span className="truncate">{item.label}</span>
            </div>
          ))}
          
          {/* Add subitem button for banners */}
          {section.type === 'banner' && subitems.length < 3 && (
            <div className="flex items-center gap-2 px-2 py-1 text-sm text-primary hover:text-primary/80 cursor-pointer">
              <Plus className="h-3 w-3" />
              <span>Adicionar slide ({subitems.length}/3)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper to get label (duplicated to avoid circular dependency)
function getSectionLabel(type: SectionType): string {
  const labels: Record<SectionType, string> = {
    banner: 'Banner',
    modules: 'Módulos',
    courses: 'Cursos',
    continue_watching: 'Continuar Assistindo',
    text: 'Texto',
    spacer: 'Espaçador',
  };
  return labels[type];
}
