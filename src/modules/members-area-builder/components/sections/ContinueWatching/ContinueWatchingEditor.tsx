/**
 * Continue Watching Editor - Editor de configurações
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { Section, ContinueWatchingSettings } from '../../../types/builder.types';

interface ContinueWatchingEditorProps {
  section: Section;
  onUpdate: (settings: Partial<ContinueWatchingSettings>) => void;
}

export function ContinueWatchingEditor({ section, onUpdate }: ContinueWatchingEditorProps) {
  const settings = section.settings as ContinueWatchingSettings;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Máximo de Itens</Label>
        <Input
          type="number"
          min={1}
          max={20}
          value={settings.max_items || 10}
          onChange={(e) => onUpdate({ max_items: parseInt(e.target.value) || 10 })}
        />
        <p className="text-xs text-muted-foreground">
          Quantidade máxima de conteúdos em progresso a exibir
        </p>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Esta seção exibe automaticamente os conteúdos que o aluno começou a assistir mas não terminou.
        </p>
      </div>
    </div>
  );
}
