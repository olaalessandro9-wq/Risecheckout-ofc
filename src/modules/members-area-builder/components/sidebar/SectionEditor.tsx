/**
 * Section Editor - Editor contextual de seção
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { getSectionLabel } from '../../registry';
import { BannerEditor } from '../sections/Banner/BannerEditor';
import { ModulesEditor } from '../sections/Modules/ModulesEditor';
import { CoursesEditor } from '../sections/Courses/CoursesEditor';
import { ContinueWatchingEditor } from '../sections/ContinueWatching/ContinueWatchingEditor';
import { TextEditor } from '../sections/Text/TextEditor';
import { SpacerEditor } from '../sections/Spacer/SpacerEditor';
import type { Section, SectionSettings, MemberModule } from '../../types/builder.types';

interface SectionEditorProps {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onUpdateSettings: (settings: Partial<SectionSettings>) => void;
  modules?: MemberModule[];
  onModuleEdit?: (moduleId: string) => void;
}

export function SectionEditor({ section, onUpdate, onUpdateSettings, modules, onModuleEdit }: SectionEditorProps) {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h3 className="font-semibold text-lg">
          {getSectionLabel(section.type)}
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure esta seção
        </p>
      </div>

      <Separator />

      {/* Common Settings */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="section-title">Título da Seção</Label>
          <Input
            id="section-title"
            value={section.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value || null })}
            placeholder="Ex: Meus Cursos"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Seção Ativa</Label>
            <p className="text-xs text-muted-foreground">
              Seções inativas não aparecem para alunos
            </p>
          </div>
          <Switch
            checked={section.is_active}
            onCheckedChange={(checked) => onUpdate({ is_active: checked })}
          />
        </div>
      </div>

      <Separator />

      {/* Type-specific Settings */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Configurações Específicas</h4>
        
        {section.type === 'banner' && (
          <BannerEditor section={section} onUpdate={onUpdateSettings} />
        )}
        {section.type === 'modules' && (
          <ModulesEditor 
            section={section} 
            onUpdate={onUpdateSettings} 
            modules={modules}
            onModuleEdit={onModuleEdit}
          />
        )}
        {section.type === 'courses' && (
          <CoursesEditor section={section} onUpdate={onUpdateSettings} />
        )}
        {section.type === 'continue_watching' && (
          <ContinueWatchingEditor section={section} onUpdate={onUpdateSettings} />
        )}
        {section.type === 'text' && (
          <TextEditor section={section} onUpdate={onUpdateSettings} />
        )}
        {section.type === 'spacer' && (
          <SpacerEditor section={section} onUpdate={onUpdateSettings} />
        )}
      </div>
    </div>
  );
}
