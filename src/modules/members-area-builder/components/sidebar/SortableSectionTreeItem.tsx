/**
 * Sortable Section Tree Item - Item sortable da árvore de seções
 * Usa @dnd-kit para drag-and-drop
 * Inclui editor inline colapsável
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  Eye,
  EyeOff,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable as useNestedSortable,
} from '@dnd-kit/sortable';
import { SectionEditor } from './SectionEditor';
import type { Section, SectionType, BannerSettings, MemberModule, ModulesSettings, SectionSettings } from '../../types/builder.types';
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

interface SortableSectionTreeItemProps {
  section: Section;
  isSelected: boolean;
  isEditing: boolean;
  modules?: MemberModule[];
  allModules?: MemberModule[];
  onSelect: () => void;
  onToggleEditor: () => void;
  onDelete: () => void;
  onToggleModuleVisibility?: (moduleId: string) => void;
  onReorderModules?: (orderedIds: string[]) => void;
  onUpdateSection: (updates: Partial<Section>) => void;
  onUpdateSettings: (settings: Partial<SectionSettings>) => void;
  onModuleEdit?: (moduleId: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

export function SortableSectionTreeItem({
  section,
  isSelected,
  isEditing,
  modules = [],
  allModules = [],
  onSelect,
  onToggleEditor,
  onDelete,
  onToggleModuleVisibility,
  onReorderModules,
  onUpdateSection,
  onUpdateSettings,
  onModuleEdit,
  isFirst,
  isLast,
}: SortableSectionTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = SECTION_ICONS[section.type];
  const canDelete = canDeleteSection(section.type);
  
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
  
  // Nested DnD sensors for modules
  const nestedSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
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
        // Show ALL modules with visibility status
        const settings = section.settings as ModulesSettings;
        const hiddenIds = settings.hidden_module_ids || [];
        return allModules.map(m => ({
          id: m.id,
          label: m.title,
          type: 'module' as const,
          isHidden: hiddenIds.includes(m.id),
        }));
      }
      default:
        return [];
    }
  };
  
  const subitems = getSubitems();
  const hasSubitems = subitems.length > 0 || section.type === 'banner' || section.type === 'modules';
  
  const sectionLabel = section.title || getSectionLabel(section.type);

  // Handle module drag end
  const handleModuleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && onReorderModules) {
      const moduleItems = subitems.filter(s => s.type === 'module');
      const oldIndex = moduleItems.findIndex(m => m.id === active.id);
      const newIndex = moduleItems.findIndex(m => m.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...moduleItems];
        const [moved] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, moved);
        
        onReorderModules(newOrder.map(m => m.id));
      }
    }
  };
  
  return (
    <div ref={setNodeRef} style={style} className="select-none group/tree-item">
      {/* Main section row */}
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors',
          'hover:bg-accent/50',
          isSelected && 'bg-accent text-accent-foreground',
          isEditing && 'bg-primary/10 border border-primary/30'
        )}
        onClick={onToggleEditor}
      >
        {/* Drag handle */}
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent/50 rounded"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        {/* Expand/collapse chevron for subitems */}
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
        
        {/* Settings indicator when editing */}
        {isEditing && (
          <Settings2 className="h-3.5 w-3.5 text-primary" />
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
      
      {/* Inline Editor - Collapsible */}
      <Collapsible open={isEditing}>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <div className="mx-2 mt-1 mb-2 p-3 rounded-lg bg-muted/50 border">
            <SectionEditor
              section={section}
              onUpdate={onUpdateSection}
              onUpdateSettings={onUpdateSettings}
              modules={section.type === 'modules' ? allModules : undefined}
              onModuleEdit={section.type === 'modules' ? onModuleEdit : undefined}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Subitems (slides/modules) */}
      {isExpanded && hasSubitems && !isEditing && (
        <div className="ml-6 border-l border-border pl-2 mt-1 space-y-0.5">
          {section.type === 'modules' ? (
            // Modules with DnD and visibility toggle
            <DndContext
              sensors={nestedSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleModuleDragEnd}
            >
              <SortableContext
                items={subitems.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {subitems.map((item) => (
                  <SortableModuleItem
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    isHidden={'isHidden' in item ? item.isHidden : false}
                    onToggleVisibility={() => onToggleModuleVisibility?.(item.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            // Regular subitems (slides, etc)
            subitems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer rounded hover:bg-accent/30"
              >
                <span className="truncate">{item.label}</span>
              </div>
            ))
          )}
          
          {section.type === 'modules' && subitems.length === 0 && (
            <div className="text-xs text-muted-foreground py-2 px-2">
              Nenhum módulo cadastrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Sortable Module Item component
interface SortableModuleItemProps {
  id: string;
  label: string;
  isHidden: boolean;
  onToggleVisibility: () => void;
}

function SortableModuleItem({ id, label, isHidden, onToggleVisibility }: SortableModuleItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useNestedSortable({ id });
  
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
        'flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent/30 group/module',
        isHidden ? 'text-muted-foreground/50' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {/* Drag handle */}
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-accent/50 rounded"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      
      {/* Module name */}
      <span className={cn('flex-1 truncate', isHidden && 'line-through')}>{label}</span>
      
      {/* Visibility toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        className="opacity-0 group-hover/module:opacity-100 transition-opacity p-0.5 hover:bg-accent rounded"
        title={isHidden ? 'Mostrar módulo' : 'Ocultar módulo'}
      >
        {isHidden ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

// Helper to get label
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
