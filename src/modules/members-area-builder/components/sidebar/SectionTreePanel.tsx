/**
 * Section Tree Panel - Painel com árvore de seções
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Plus, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SectionTreeItem } from './SectionTreeItem';
import { SectionRegistry, getAvailableSectionTypes } from '../../registry';
import type { Section, SectionType, MemberModule, BuilderActions } from '../../types/builder.types';

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
  
  const handleAddSection = async (type: SectionType) => {
    await actions.addSection(type);
  };
  
  const handleDeleteSection = async (id: string) => {
    await actions.deleteSection(id);
  };
  
  const handleMoveSection = async (sectionId: string, direction: 'up' | 'down') => {
    const index = sortedSections.findIndex(s => s.id === sectionId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sortedSections.length) return;
    
    // Swap positions
    const newOrder = [...sortedSections];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    
    await actions.reorderSections(newOrder.map(s => s.id));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Início */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Home className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">Início</span>
      </div>
      
      {/* Sections Label */}
      <div className="px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Seções
        </span>
      </div>
      
      {/* Sections Tree */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 pb-4">
          {sortedSections.map((section, index) => (
            <div key={section.id} className="group/tree-item">
              <SectionTreeItem
                section={section}
                isSelected={section.id === selectedSectionId}
                modules={section.type === 'modules' ? modules : undefined}
                onSelect={() => actions.selectSection(section.id)}
                onDelete={() => handleDeleteSection(section.id)}
                onMoveUp={() => handleMoveSection(section.id, 'up')}
                onMoveDown={() => handleMoveSection(section.id, 'down')}
                isFirst={index === 0}
                isLast={index === sortedSections.length - 1}
              />
            </div>
          ))}
          
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
