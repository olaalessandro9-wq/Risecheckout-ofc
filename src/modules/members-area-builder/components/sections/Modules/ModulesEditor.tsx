/**
 * Modules Editor - Editor de configurações de módulos
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Section, ModulesSettings } from '../../../types/builder.types';

interface ModulesEditorProps {
  section: Section;
  onUpdate: (settings: Partial<ModulesSettings>) => void;
}

export function ModulesEditor({ section, onUpdate }: ModulesEditorProps) {
  const settings = section.settings as ModulesSettings;

  return (
    <div className="space-y-4">
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
  );
}
