/**
 * Section Editor - Editor contextual de seção
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSectionLabel } from '../../registry';
import { FixedHeaderEditor } from '../sections/FixedHeader/FixedHeaderEditor';
import { BannerEditor } from '../sections/Banner/BannerEditor';
import { ModulesEditor } from '../sections/Modules/ModulesEditor';
import { CoursesEditor } from '../sections/Courses/CoursesEditor';
import { ContinueWatchingEditor } from '../sections/ContinueWatching/ContinueWatchingEditor';
import { TextEditor } from '../sections/Text/TextEditor';
import { SpacerEditor } from '../sections/Spacer/SpacerEditor';
import type { Section, SectionSettings, MemberModule, ModulesSettings, FixedHeaderSettings } from '../../types/builder.types';

interface SectionEditorProps {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onUpdateSettings: (settings: Partial<SectionSettings>) => void;
  modules?: MemberModule[];
  productId?: string;
  onModuleEdit?: (moduleId: string) => void;
}

export function SectionEditor({ section, onUpdate, onUpdateSettings, modules, productId, onModuleEdit }: SectionEditorProps) {
  // Fixed Header has its own complete editor
  if (section.type === 'fixed_header') {
    return (
      <div className="space-y-6">
        <FixedHeaderEditor 
          section={section} 
          onUpdate={onUpdateSettings as (settings: Partial<FixedHeaderSettings>) => void} 
          productId={productId} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Common Settings - Only for non-banner sections */}
      {section.type !== 'banner' && (
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

          {/* Title Size - Only for modules sections */}
          {section.type === 'modules' && (
            <div className="space-y-2">
              <Label>Tamanho do Título</Label>
              <Select
                value={(section.settings as ModulesSettings).title_size || 'medium'}
                onValueChange={(value: 'small' | 'medium' | 'large') => 
                  onUpdateSettings({ title_size: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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
      )}

      {/* For Banner: specific settings come BEFORE common settings */}
      {section.type === 'banner' && (
        <>
          <BannerEditor section={section} onUpdate={onUpdateSettings} productId={productId} />
          <Separator />
        </>
      )}

      {/* Common Settings - shown after specific settings for Banner */}
      {section.type === 'banner' && (
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
      )}

      {/* For other section types: common settings first, then specific */}
      {section.type !== 'banner' && (
        <>
          <Separator />

          {/* Type-specific Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Configurações Específicas</h4>
            
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
        </>
      )}
    </div>
  );
}
