/**
 * Section Tree Panel - Painel com árvore de seções
 * Suporta drag-and-drop para reordenar seções
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from '@dnd-kit/sortable';
import { SortableSectionTreeItem } from './SortableSectionTreeItem';
import { SectionRegistry, getAvailableSectionTypes } from '../../registry';
import type { Section, SectionType, MemberModule, BuilderActions, ModulesSettings } from '../../types/builder.types';

interface SectionTreePanelProps {
  sections: Section[];
  selectedSectionId: string | null;
  modules: MemberModule[];
  actions: BuilderActions;
}

export function SectionTreePanel({
  sections,
  selectedSectionId,
  modules,
  actions,
}: SectionTreePanelProps) {
  // Sort sections by position
  const sortedSections = [...sections].sort((a, b) => a.position - b.position);
  
  // Get available section types that can be added
  const availableTypes = getAvailableSectionTypes(sections);
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleAddSection = async (type: SectionType) => {
    await actions.addSection(type);
  };
  
  const handleDeleteSection = async (id: string) => {
    await actions.deleteSection(id);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = sortedSections.findIndex(s => s.id === active.id);
      const newIndex = sortedSections.findIndex(s => s.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...sortedSections];
        const [moved] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, moved);
        
        actions.reorderSections(newOrder.map(s => s.id));
      }
    }
  };

  // Get modules for a specific section, applying order and visibility filters
  const getModulesForSection = (section: Section): MemberModule[] => {
    if (section.type !== 'modules') return [];
    
    const settings = section.settings as ModulesSettings;
    const hiddenIds = settings.hidden_module_ids || [];
    const orderIds = settings.module_order || [];
    
    // Filter out hidden modules
    let visibleModules = modules.filter(m => !hiddenIds.includes(m.id));
    
    // Apply custom order if specified
    if (orderIds.length > 0) {
      visibleModules.sort((a, b) => {
        const indexA = orderIds.indexOf(a.id);
        const indexB = orderIds.indexOf(b.id);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    
    return visibleModules;
  };

  // Handle module visibility toggle
  const handleToggleModuleVisibility = async (sectionId: string, moduleId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section || section.type !== 'modules') return;
    
    const settings = section.settings as ModulesSettings;
    const hiddenIds = settings.hidden_module_ids || [];
    
    const newHiddenIds = hiddenIds.includes(moduleId)
      ? hiddenIds.filter(id => id !== moduleId)
      : [...hiddenIds, moduleId];
    
    await actions.updateSectionSettings(sectionId, { hidden_module_ids: newHiddenIds });
  };

  // Handle module reorder within section
  const handleReorderModules = async (sectionId: string, orderedIds: string[]) => {
    await actions.updateSectionSettings(sectionId, { module_order: orderedIds });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sections Label */}
      <div className="px-4 py-3 border-b">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Seções
        </span>
      </div>
      
      {/* Sections Tree with DnD */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 py-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedSections.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedSections.map((section, index) => (
                <SortableSectionTreeItem
                  key={section.id}
                  section={section}
                  isSelected={section.id === selectedSectionId}
                  modules={getModulesForSection(section)}
                  allModules={modules}
                  onSelect={() => actions.selectSection(section.id)}
                  onDelete={() => handleDeleteSection(section.id)}
                  onToggleModuleVisibility={(moduleId) => handleToggleModuleVisibility(section.id, moduleId)}
                  onReorderModules={(orderedIds) => handleReorderModules(section.id, orderedIds)}
                  isFirst={index === 0}
                  isLast={index === sortedSections.length - 1}
                />
              ))}
            </SortableContext>
          </DndContext>
          
          {sortedSections.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Nenhuma seção ainda
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Add Section Button */}
      <div className="p-3 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Adicionar seção
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            {availableTypes.length > 0 ? (
              availableTypes.map((type) => {
                const config = SectionRegistry[type];
                return (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => handleAddSection(type)}
                    className="gap-2"
                  >
                    <span>{config.label}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {config.description}
                    </span>
                  </DropdownMenuItem>
                );
              })
            ) : (
              <DropdownMenuItem disabled>
                Todas as seções já foram adicionadas
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
