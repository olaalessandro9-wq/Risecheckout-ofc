/**
 * Modules Editor - Editor de configurações de módulos
 * Agora também exibe lista de módulos para edição individual
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Pencil, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Section, ModulesSettings, MemberModule } from '../../../types/builder.types';

interface ModulesEditorProps {
  section: Section;
  onUpdate: (settings: Partial<ModulesSettings>) => void;
  modules?: MemberModule[];
  onModuleEdit?: (moduleId: string) => void;
}

export function ModulesEditor({ section, onUpdate, modules = [], onModuleEdit }: ModulesEditorProps) {
  const settings = section.settings as ModulesSettings;

  return (
    <div className="space-y-6">
      {/* Section Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Configurações da Seção</h4>
        
        {/* Course Selection - placeholder for now */}
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
              {/* TODO: Populate with actual courses */}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Selecione qual curso exibir nesta seção
          </p>
        </div>

        {/* Cards Per Row */}
        <div className="space-y-2">
          <Label>Cards por Linha</Label>
          <Select
            value={String(settings.cards_per_row || 4)}
            onValueChange={(value) => onUpdate({ cards_per_row: parseInt(value) as 3 | 4 | 5 })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 cards</SelectItem>
              <SelectItem value="4">4 cards</SelectItem>
              <SelectItem value="5">5 cards</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Modules List for Individual Editing */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          Editar Capas dos Módulos ({modules.length})
        </h4>
        
        {modules.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhum módulo cadastrado.
          </p>
        ) : (
          <div className="space-y-2">
            {modules.map((module) => (
              <ModuleListItem 
                key={module.id} 
                module={module} 
                onEdit={() => onModuleEdit(module.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ModuleListItemProps {
  module: MemberModule;
  onEdit: () => void;
}

function ModuleListItem({ module, onEdit }: ModuleListItemProps) {
  return (
    <div 
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg border transition-colors cursor-pointer hover:bg-accent',
        !module.is_active && 'opacity-60'
      )}
      onClick={onEdit}
    >
      {/* Thumbnail */}
      <div className="w-10 h-14 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
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
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{module.title}</p>
        <p className="text-xs text-muted-foreground">
          {module.cover_image_url ? 'Com capa' : 'Sem capa'}
        </p>
      </div>

      {/* Edit Button */}
      <Button variant="ghost" size="icon" className="flex-shrink-0">
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
}

