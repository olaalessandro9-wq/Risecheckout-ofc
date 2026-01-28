/**
 * Modules Editor - Editor de configurações de módulos
 * Suporta reordenação e visibilidade de módulos
 * 
 * @see RISE ARCHITECT PROTOCOL V3
 */

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
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
import type { Section, ModulesSettings, MemberModule } from '../../../types/builder.types';
import { SortableModuleListItem } from './SortableModuleListItem';

interface ModulesEditorProps {
  section: Section;
  onUpdate: (settings: Partial<ModulesSettings>) => void;
  modules?: MemberModule[];
  onModuleEdit?: (moduleId: string) => void;
}

export function ModulesEditor({ section, onUpdate, modules = [], onModuleEdit }: ModulesEditorProps) {
  const settings = section.settings as ModulesSettings;
  const hiddenIds = settings.hidden_module_ids || [];
  const orderIds = settings.module_order || [];
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get ordered modules
  const getOrderedModules = (): MemberModule[] => {
    if (orderIds.length === 0) return modules;
    
    const moduleMap = new Map(modules.map(m => [m.id, m]));
    const ordered: MemberModule[] = [];
    
    // Add modules in order
    for (const id of orderIds) {
      const module = moduleMap.get(id);
      if (module) {
        ordered.push(module);
        moduleMap.delete(id);
      }
    }
    
    // Add remaining modules not in order
    for (const module of moduleMap.values()) {
      ordered.push(module);
    }
    
    return ordered;
  };
  
  const orderedModules = getOrderedModules();

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = orderedModules.findIndex(m => m.id === active.id);
      const newIndex = orderedModules.findIndex(m => m.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...orderedModules];
        const [moved] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, moved);
        
        onUpdate({ module_order: newOrder.map(m => m.id) });
      }
    }
  };

  // Toggle module visibility
  const handleToggleVisibility = (moduleId: string) => {
    const newHiddenIds = hiddenIds.includes(moduleId)
      ? hiddenIds.filter(id => id !== moduleId)
      : [...hiddenIds, moduleId];
    
    onUpdate({ hidden_module_ids: newHiddenIds });
  };

  return (
    <div className="space-y-6">
      {/* Section Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Configurações da Seção</h4>
        
        {/* Course Selection */}
        <div className="space-y-2">
          <Label>Curso</Label>
          <Select
            value={settings.course_id || 'all'}
            onValueChange={(value) => onUpdate({ course_id: value === 'all' ? null : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cursos</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Selecione qual curso exibir nesta seção
          </p>
        </div>

        {/* Card Size Control */}
        <div className="space-y-2">
          <Label>Tamanho dos Cards</Label>
          <Select
            value={settings.card_size || 'medium'}
            onValueChange={(value: 'small' | 'medium' | 'large') => 
              onUpdate({ card_size: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Pequeno (mais cards visíveis)</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="large">Grande (menos cards visíveis)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Define a largura dos cards no carousel
          </p>
        </div>

        {/* Show Title */}
        <div className="space-y-2">
          <Label>Exibir Título do Módulo</Label>
          <Select
            value={settings.show_title || 'always'}
            onValueChange={(value: 'always' | 'hover' | 'never') => onUpdate({ show_title: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="always">Sempre visível</SelectItem>
              <SelectItem value="hover">Apenas no hover</SelectItem>
              <SelectItem value="never">Nunca</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Show Progress */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Mostrar Progresso</Label>
            <p className="text-xs text-muted-foreground">
              Exibe barra de progresso do aluno
            </p>
          </div>
          <Switch
            checked={settings.show_progress}
            onCheckedChange={(checked) => onUpdate({ show_progress: checked })}
          />
        </div>
      </div>

      <Separator />

      {/* Modules List for Ordering and Visibility */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">
            Módulos ({modules.length})
          </h4>
          <p className="text-xs text-muted-foreground">
            Arraste para reordenar
          </p>
        </div>
        
        {modules.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhum módulo cadastrado.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedModules.map(m => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {orderedModules.map((module) => (
                  <SortableModuleListItem 
                    key={module.id} 
                    module={module}
                    isHidden={hiddenIds.includes(module.id)}
                    onEdit={() => onModuleEdit?.(module.id)}
                    onToggleVisibility={() => handleToggleVisibility(module.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
