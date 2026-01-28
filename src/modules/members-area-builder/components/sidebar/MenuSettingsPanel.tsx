/**
 * Menu Settings Panel - Configurações do menu/sidebar da área de membros
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { MousePointer2, Hand, Loader2, Check, Monitor, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MembersAreaBuilderSettings } from '../../types';
import { MenuEditor } from './MenuEditor';

interface MenuSettingsPanelProps {
  settings: MembersAreaBuilderSettings;
  onUpdate: (settings: Partial<MembersAreaBuilderSettings>) => void;
}

export function MenuSettingsPanel({ settings, onUpdate }: MenuSettingsPanelProps) {
  // Estado local para optimistic update (reage imediatamente)
  const [localAnimation, setLocalAnimation] = useState(settings.sidebar_animation);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Sincronizar quando settings externo muda
  useEffect(() => {
    setLocalAnimation(settings.sidebar_animation);
  }, [settings.sidebar_animation]);

  const handleAnimationChange = useCallback((value: 'click' | 'hover') => {
    // Cancelar debounce anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Optimistic update: atualiza imediatamente no local
    setLocalAnimation(value);
    setIsSaving(true);
    setJustSaved(false);

    // Debounce: só salva após 500ms de inatividade
    debounceRef.current = setTimeout(async () => {
      await onUpdate({ sidebar_animation: value });
      setIsSaving(false);
      setJustSaved(true);
      
      // Mostrar checkmark por 1.5s
      setTimeout(() => setJustSaved(false), 1500);
    }, 500);
  }, [onUpdate]);

  // Cleanup do timeout no unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const showDesktop = settings.show_menu_desktop ?? true;
  const showMobile = settings.show_menu_mobile ?? true;

  return (
    <div className="space-y-6">
      {/* Menu Visibility */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Visibilidade do Menu</h3>
        
        <div className="space-y-3">
          {/* Desktop Toggle */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg border transition-all",
            showDesktop ? "border-primary bg-primary/5" : "border-border"
          )}>
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Desktop</p>
                <p className="text-xs text-muted-foreground">Sidebar lateral</p>
              </div>
            </div>
            <Switch
              checked={showDesktop}
              onCheckedChange={(checked) => onUpdate({ show_menu_desktop: checked })}
            />
          </div>
          
          {/* Mobile Toggle */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg border transition-all",
            showMobile ? "border-primary bg-primary/5" : "border-border"
          )}>
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Mobile</p>
                <p className="text-xs text-muted-foreground">Barra inferior</p>
              </div>
            </div>
            <Switch
              checked={showMobile}
              onCheckedChange={(checked) => onUpdate({ show_menu_mobile: checked })}
            />
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-3">
          Desative o menu para um layout mais limpo focado no conteúdo.
        </p>
      </div>

      <Separator />

      {/* Sidebar Animation - Desktop Only (only show if desktop menu is enabled) */}
      {showDesktop && (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Animação do Menu (Desktop)</h3>
          
          {/* Indicador de status */}
          {isSaving && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Salvando...
            </span>
          )}
          {justSaved && !isSaving && (
            <span className="flex items-center gap-1.5 text-xs text-green-600">
              <Check className="h-3 w-3" />
              Salvo
            </span>
          )}
        </div>
        
        <RadioGroup
          value={localAnimation}
          onValueChange={handleAnimationChange}
          disabled={isSaving}
          className="space-y-3"
        >
          <div className={cn(
            "flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer",
            localAnimation === 'click' 
              ? "border-primary bg-primary/5" 
              : "border-border hover:bg-muted/50",
            isSaving && "opacity-60 pointer-events-none"
          )}>
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
          
          <div className={cn(
            "flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer",
            localAnimation === 'hover' 
              ? "border-primary bg-primary/5" 
              : "border-border hover:bg-muted/50",
            isSaving && "opacity-60 pointer-events-none"
          )}>
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
      )}

      {/* Menu Editor - only show if at least one platform has menu enabled */}
      {(showDesktop || showMobile) && (
      <>
      <Separator />

      <div>
        <h3 className="font-semibold text-lg mb-4">Itens do Menu</h3>
        <MenuEditor
          items={settings.menu_items}
          onUpdate={(items) => onUpdate({ menu_items: items })}
        />
      </div>
      </>
      )}
    </div>
  );
}
