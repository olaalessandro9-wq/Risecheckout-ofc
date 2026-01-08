/**
 * Menu Settings Panel - Configurações do menu/sidebar da área de membros
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { MousePointer2, Hand } from 'lucide-react';
import type { MembersAreaBuilderSettings } from '../../types/builder.types';
import { MenuEditor } from './MenuEditor';

interface MenuSettingsPanelProps {
  settings: MembersAreaBuilderSettings;
  onUpdate: (settings: Partial<MembersAreaBuilderSettings>) => void;
}

export function MenuSettingsPanel({ settings, onUpdate }: MenuSettingsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Sidebar Animation - Desktop Only */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Animação do Menu (Desktop)</h3>
        
        <RadioGroup
          value={settings.sidebar_animation}
          onValueChange={(value: 'click' | 'hover') => onUpdate({ sidebar_animation: value })}
          className="space-y-3"
        >
          <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
            <RadioGroupItem value="click" id="menu-anim-click" className="mt-0.5" />
            <div className="flex-1">
              <Label htmlFor="menu-anim-click" className="flex items-center gap-2 cursor-pointer font-medium">
                <Hand className="h-4 w-4" />
                Clique (botão)
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Um botão aparece para expandir/colapsar o menu
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
            <RadioGroupItem value="hover" id="menu-anim-hover" className="mt-0.5" />
            <div className="flex-1">
              <Label htmlFor="menu-anim-hover" className="flex items-center gap-2 cursor-pointer font-medium">
                <MousePointer2 className="h-4 w-4" />
                Hover (mouse)
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                O menu expande ao passar o mouse e fecha ao sair
              </p>
            </div>
          </div>
        </RadioGroup>
        
        <p className="text-xs text-muted-foreground mt-3 p-2 bg-muted/30 rounded-md">
          💡 Esta configuração afeta apenas a versão desktop. No mobile, a navegação inferior é sempre usada.
        </p>
      </div>

      <Separator />

      {/* Menu Editor */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Itens do Menu</h3>
        <MenuEditor
          items={settings.menu_items}
          onUpdate={(items) => onUpdate({ menu_items: items })}
        />
      </div>
    </div>
  );
}
