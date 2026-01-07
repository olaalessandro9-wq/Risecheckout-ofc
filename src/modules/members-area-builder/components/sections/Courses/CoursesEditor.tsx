/**
 * Courses Editor - Editor de configurações de cursos
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Section, CoursesSettings } from '../../../types/builder.types';

interface CoursesEditorProps {
  section: Section;
  onUpdate: (settings: Partial<CoursesSettings>) => void;
}

export function CoursesEditor({ section, onUpdate }: CoursesEditorProps) {
  const settings = section.settings as CoursesSettings;

  return (
    <div className="space-y-4">
      {/* Layout */}
      <div className="space-y-2">
        <Label>Layout</Label>
        <Select
          value={settings.layout || 'carousel'}
          onValueChange={(value: 'grid' | 'carousel') => onUpdate({ layout: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="carousel">Carrossel</SelectItem>
            <SelectItem value="grid">Grade</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards Per Row (only for grid) */}
      {settings.layout === 'grid' && (
        <div className="space-y-2">
          <Label>Cards por Linha</Label>
          <Select
            value={String(settings.cards_per_row || 4)}
            onValueChange={(value) => onUpdate({ cards_per_row: parseInt(value) as 3 | 4 })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 cards</SelectItem>
              <SelectItem value="4">4 cards</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Course Selection - placeholder */}
      <div className="space-y-2">
        <Label>Cursos Exibidos</Label>
        <p className="text-sm text-muted-foreground">
          Todos os cursos do produto são exibidos automaticamente.
        </p>
        {/* TODO: Add course multi-select when needed */}
      </div>
    </div>
  );
}
