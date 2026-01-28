/**
 * FixedHeader Editor - Editor panel for fixed header section
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FixedHeaderImageUpload } from './FixedHeaderImageUpload';
import type { 
  Section, 
  FixedHeaderSettings, 
  GradientDirection,
  GradientOverlayConfig,
} from '../../../types/builder.types';
import { DEFAULT_GRADIENT_OVERLAY } from '../../../types/builder.types';

interface FixedHeaderEditorProps {
  section: Section;
  onUpdate: (settings: Partial<FixedHeaderSettings>) => void;
  productId?: string;
}

export function FixedHeaderEditor({ section, onUpdate, productId }: FixedHeaderEditorProps) {
  const settings = section.settings as FixedHeaderSettings;
  const gradientOverlay = settings.gradient_overlay ?? DEFAULT_GRADIENT_OVERLAY;

  const updateGradient = (updates: Partial<GradientOverlayConfig>) => {
    onUpdate({ 
      gradient_overlay: { 
        ...gradientOverlay, 
        ...updates 
      } 
    });
  };

  return (
    <div className="space-y-6">
      {/* Background Image */}
      <div className="space-y-2">
        <Label>Imagem de Fundo</Label>
        <FixedHeaderImageUpload
          imageUrl={settings.bg_image_url || ''}
          productId={productId}
          onImageChange={(url) => onUpdate({ bg_image_url: url })}
        />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="header-title">Título</Label>
        <Input
          id="header-title"
          value={settings.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Ex: RatoFlix - Tenha acesso a tudo"
        />
        <p className="text-xs text-muted-foreground">
          Se vazio, usa o nome do produto
        </p>
      </div>

      {/* Module Counter Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Mostrar Contador de Módulos</Label>
          <p className="text-xs text-muted-foreground">
            Exibe "X módulos" abaixo do título
          </p>
        </div>
        <Switch
          checked={settings.show_module_count ?? true}
          onCheckedChange={(checked) => onUpdate({ show_module_count: checked })}
        />
      </div>

      {/* Alignment */}
      <div className="space-y-2">
        <Label>Alinhamento</Label>
        <Select
          value={settings.alignment || 'left'}
          onValueChange={(value: 'left' | 'center') => onUpdate({ alignment: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Esquerda</SelectItem>
            <SelectItem value="center">Centro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Size */}
      <div className="space-y-2">
        <Label>Tamanho</Label>
        <Select
          value={settings.size || 'large'}
          onValueChange={(value: 'small' | 'medium' | 'large') => onUpdate({ size: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Pequeno</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="large">Grande (Hero)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Gradient Overlay Settings */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Efeito de Gradiente</Label>
            <p className="text-xs text-muted-foreground">
              Suaviza a transição para o conteúdo
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
                min={20}
                max={100}
                step={5}
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
                  <RadioGroupItem value="theme" id="header-gradient-theme" />
                  <Label htmlFor="header-gradient-theme" className="font-normal cursor-pointer">
                    Usar cor do tema (recomendado)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="header-gradient-custom" />
                  <Label htmlFor="header-gradient-custom" className="font-normal cursor-pointer">
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
  );
}
