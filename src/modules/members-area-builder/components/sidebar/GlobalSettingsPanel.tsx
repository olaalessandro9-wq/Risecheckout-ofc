/**
 * Global Settings Panel - Configurações globais da área de membros
 * Includes global gradient overlay controls (SSOT for entire members area)
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { 
  MembersAreaBuilderSettings,
  GradientDirection,
  GradientOverlayConfig,
} from '../../types';
import { DEFAULT_GRADIENT_OVERLAY } from '../../types';

interface GlobalSettingsPanelProps {
  settings: MembersAreaBuilderSettings;
  onUpdate: (settings: Partial<MembersAreaBuilderSettings>) => void;
}

export function GlobalSettingsPanel({ settings, onUpdate }: GlobalSettingsPanelProps) {
  const gradientOverlay = settings.gradient_overlay ?? DEFAULT_GRADIENT_OVERLAY;

  const updateGradient = (updates: Partial<GradientOverlayConfig>) => {
    onUpdate({
      gradient_overlay: {
        ...gradientOverlay,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Aparência</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tema</Label>
            <Select
              value={settings.theme}
              onValueChange={(value: 'light' | 'dark') => onUpdate({ theme: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Escuro (Netflix)</SelectItem>
                <SelectItem value="light">Claro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cor Principal</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={settings.primary_color}
                onChange={(e) => onUpdate({ primary_color: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={settings.primary_color}
                onChange={(e) => onUpdate({ primary_color: e.target.value })}
                placeholder="#6366f1"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Global Gradient Overlay (SSOT) */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Efeito de Gradiente</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Aplica-se a toda a área de membros (header, banner, conteúdo)
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Gradiente</Label>
              <p className="text-xs text-muted-foreground">
                Suaviza a transição entre seções
              </p>
            </div>
            <Switch
              checked={gradientOverlay.enabled}
              onCheckedChange={(enabled) => updateGradient({ enabled })}
            />
          </div>

          {gradientOverlay.enabled && (
            <>
              {/* Direction */}
              <div className="space-y-2">
                <Label>Direção</Label>
                <Select
                  value={gradientOverlay.direction}
                  onValueChange={(direction: GradientDirection) => updateGradient({ direction })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom">Para Baixo ↓</SelectItem>
                    <SelectItem value="top">Para Cima ↑</SelectItem>
                    <SelectItem value="left">Para Esquerda ←</SelectItem>
                    <SelectItem value="right">Para Direita →</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Strength Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Intensidade</Label>
                  <span className="text-xs text-muted-foreground">
                    {gradientOverlay.strength}%
                  </span>
                </div>
                <Slider
                  value={[gradientOverlay.strength]}
                  onValueChange={([strength]) => updateGradient({ strength })}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              {/* Color Mode */}
              <div className="space-y-2">
                <Label>Cor do Gradiente</Label>
                <RadioGroup
                  value={gradientOverlay.use_theme_color ? 'theme' : 'custom'}
                  onValueChange={(value) => updateGradient({ use_theme_color: value === 'theme' })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="theme" id="global-gradient-theme" />
                    <Label htmlFor="global-gradient-theme" className="font-normal cursor-pointer">
                      Usar cor do tema (recomendado)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="global-gradient-custom" />
                    <Label htmlFor="global-gradient-custom" className="font-normal cursor-pointer">
                      Cor customizada
                    </Label>
                  </div>
                </RadioGroup>

                {!gradientOverlay.use_theme_color && (
                  <Input
                    type="color"
                    value={gradientOverlay.custom_color || '#000000'}
                    onChange={(e) => updateGradient({ custom_color: e.target.value })}
                    className="h-10 w-full cursor-pointer"
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Branding */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Marca</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input
              value={settings.logo_url || ''}
              onChange={(e) => onUpdate({ logo_url: e.target.value || undefined })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label>Favicon URL</Label>
            <Input
              value={settings.favicon_url || ''}
              onChange={(e) => onUpdate({ favicon_url: e.target.value || undefined })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label>Imagem de Compartilhamento (OG)</Label>
            <Input
              value={settings.share_image_url || ''}
              onChange={(e) => onUpdate({ share_image_url: e.target.value || undefined })}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              Imagem exibida ao compartilhar links
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Login Page */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Página de Login</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Layout</Label>
            <Select
              value={settings.login_layout}
              onValueChange={(value: 'centered' | 'sidebar') => onUpdate({ login_layout: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="centered">Centralizado</SelectItem>
                <SelectItem value="sidebar">Com Sidebar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Background URL</Label>
            <Input
              value={settings.login_background_url || ''}
              onChange={(e) => onUpdate({ login_background_url: e.target.value || undefined })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label>Logo do Login</Label>
            <Input
              value={settings.login_logo_url || ''}
              onChange={(e) => onUpdate({ login_logo_url: e.target.value || undefined })}
              placeholder="https://... (deixe vazio para usar logo principal)"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
