/**
 * Text Editor - Editor de configurações de texto
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Section, TextSettings } from '../../../types';

interface TextEditorProps {
  section: Section;
  onUpdate: (settings: Partial<TextSettings>) => void;
}

export function TextEditor({ section, onUpdate }: TextEditorProps) {
  const settings = section.settings as TextSettings;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Conteúdo</Label>
        <Textarea
          value={settings.content || ''}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Digite seu texto aqui..."
          rows={6}
        />
        <p className="text-xs text-muted-foreground">
          Suporta HTML básico para formatação
        </p>
      </div>

      <div className="space-y-2">
        <Label>Alinhamento</Label>
        <Select
          value={settings.alignment || 'left'}
          onValueChange={(value: 'left' | 'center' | 'right') => onUpdate({ alignment: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Esquerda</SelectItem>
            <SelectItem value="center">Centro</SelectItem>
            <SelectItem value="right">Direita</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
