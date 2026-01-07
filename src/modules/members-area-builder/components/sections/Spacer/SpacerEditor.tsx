/**
 * Spacer Editor - Editor de configurações de espaçador
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import type { Section, SpacerSettings } from '../../../types/builder.types';

interface SpacerEditorProps {
  section: Section;
  onUpdate: (settings: Partial<SpacerSettings>) => void;
}

export function SpacerEditor({ section, onUpdate }: SpacerEditorProps) {
  const settings = section.settings as SpacerSettings;
  const height = settings.height || 40;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Altura</Label>
          <span className="text-sm text-muted-foreground">{height}px</span>
        </div>
        <Slider
          value={[height]}
          min={10}
          max={200}
          step={10}
          onValueChange={([value]) => onUpdate({ height: value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Valor Exato</Label>
        <Input
          type="number"
          min={10}
          max={500}
          value={height}
          onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 40 })}
        />
      </div>
    </div>
  );
}
