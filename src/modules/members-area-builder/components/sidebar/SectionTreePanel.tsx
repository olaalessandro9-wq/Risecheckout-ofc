/**
 * Section Tree Panel - Painel com árvore de seções
 * Implementa navegação drill-down: Lista → Editor dedicado
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Plus, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { SectionEditor } from './SectionEditor';
import { SectionRegistry, getAvailableSectionTypes, canDeleteSection, getSectionLabel } from '../../registry';
import type { Section, SectionType, MemberModule, BuilderActions, ModulesSettings } from '../../types/builder.types';

interface SectionTreePanelProps {
  sections: Section[];
  selectedSectionId: string | null;
  modules: MemberModule[];
  actions: BuilderActions;
  productId?: string;
  onModuleEdit?: (moduleId: string) => void;
}

export function SectionTreePanel({
  sections,
  selectedSectionId,
  modules,
  actions,
  productId,
  onModuleEdit,
}: SectionTreePanelProps) {
  // Drill-down state: which section is being edited (full panel)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  
  // Sincronização: Preview → Sidebar
  // Quando o usuário clica em uma seção no preview, abre automaticamente o editor
  useEffect(() => {
    if (selectedSectionId !== editingSectionId) {
      setEditingSectionId(selectedSectionId);
    }
  }, [selectedSectionId]);
  
  // Sort sections by position
  const sortedSections = [...sections].sort((a, b) => a.position - b.position);
  
  // Get available section types that can be added
  const availableTypes = getAvailableSectionTypes(sections);
  
  // Find the section being edited
  const editingSection = editingSectionId 
    ? sections.find(s => s.id === editingSectionId) 
    : null;
  
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
    // Go back to list if deleted section was being edited
    if (editingSectionId === id) {
      setEditingSectionId(null);
    }
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

  // Navigate to section editor
  const handleEditSection = (sectionId: string) => {
    setEditingSectionId(sectionId);
    actions.selectSection(sectionId);
  };

  // Go back to section list
  const handleBack = () => {
    setEditingSectionId(null);
  };

  // ==========================================
  // STATE 2: Section Editor (Drill-Down View)
  // ==========================================
  if (editingSection) {
    const canDelete = canDeleteSection(editingSection.type);
    
    return (
      <div className="flex flex-col h-full">
        {/* Header with back button and section name */}
        <div className="px-3 py-3 border-b flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <span className="font-medium text-sm flex-1 truncate uppercase tracking-wider">
            {getSectionLabel(editingSection.type)}
          </span>
          
          {/* Delete button */}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir seção?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A seção "{getSectionLabel(editingSection.type)}" será removida permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteSection(editingSection.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        
        {/* Full Section Editor */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <SectionEditor
              section={editingSection}
              onUpdate={(updates) => actions.updateSection(editingSection.id, updates)}
              onUpdateSettings={(settings) => actions.updateSectionSettings(editingSection.id, settings)}
              modules={editingSection.type === 'modules' ? modules : undefined}
              productId={productId}
              onModuleEdit={editingSection.type === 'modules' ? onModuleEdit : undefined}
            />
          </div>
        </ScrollArea>
      </div>
    );
  }

  // ==========================================
  // STATE 1: Section List (Default View)
  // ==========================================
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
                  onSelect={() => actions.selectSection(section.id)}
                  onEdit={() => handleEditSection(section.id)}
                  onDelete={() => handleDeleteSection(section.id)}
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
