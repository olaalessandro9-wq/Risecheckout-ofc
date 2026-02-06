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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUploadWithCrop } from '../../shared/ImageUploadWithCrop';
import { HEADER_UPLOAD_CONFIG } from '../../shared/imageUploadConfigs';
import { FIXED_HEADER_LIMITS } from '@/lib/constants/field-limits';
import type { 
  Section, 
  FixedHeaderSettings, 
  GradientDirection,
  GradientOverlayConfig,
} from '../../../types';
import { DEFAULT_GRADIENT_OVERLAY } from '../../../types';

interface FixedHeaderEditorProps {
  section: Section;
  onUpdate: (settings: Partial<FixedHeaderSettings>) => void;
  productId?: string;
}

export function FixedHeaderEditor({ section, onUpdate, productId }: FixedHeaderEditorProps) {
  const settings = section.settings as FixedHeaderSettings;
  const gradientOverlay = settings.gradient_overlay ?? DEFAULT_GRADIENT_OVERLAY;

  // Backwards compatibility
  const showStats = settings.show_stats ?? settings.show_module_count ?? true;
  const showTitle = settings.show_title ?? true;
  const showDescription = settings.show_description ?? false;
  const showCtaButton = settings.show_cta_button ?? false;

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
        <ImageUploadWithCrop
          imageUrl={settings.bg_image_url || ''}
          originalImageUrl={settings.bg_image_original_url}
          productId={productId}
          onImageChange={(url, originalUrl) =>
            onUpdate({ bg_image_url: url, bg_image_original_url: originalUrl })
          }
          config={HEADER_UPLOAD_CONFIG}
        />
      </div>

      {/* ========== CONTENT SECTION ========== */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-medium text-muted-foreground">Conteúdo</h4>
        
        {/* Title Toggle + Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mostrar Título</Label>
              <p className="text-xs text-muted-foreground">
                Exibe o título principal da header
              </p>
            </div>
            <Switch
              checked={showTitle}
              onCheckedChange={(checked) => onUpdate({ show_title: checked })}
            />
          </div>
          
          {showTitle && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <Input
                id="header-title"
                value={settings.title || ''}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Ex: RatoFlix - Tenha acesso a tudo"
                maxLength={FIXED_HEADER_LIMITS.TITLE_MAX}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Se vazio, usa o nome do produto
                </p>
                <span className="text-xs text-muted-foreground">
                  {(settings.title || '').length}/{FIXED_HEADER_LIMITS.TITLE_MAX}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Stats Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mostrar Estatísticas</Label>
              <p className="text-xs text-muted-foreground">
                Exibe "X módulos · Y aulas"
              </p>
            </div>
            <Switch
              checked={showStats}
              onCheckedChange={(checked) => onUpdate({ show_stats: checked })}
            />
          </div>
          
          {showStats && (
            <div className="pl-4 border-l-2 border-muted">
              <div className="flex items-center justify-between">
                <Label className="font-normal">Exibir quantidade de aulas</Label>
                <Switch
                  checked={settings.show_lesson_count ?? true}
                  onCheckedChange={(checked) => onUpdate({ show_lesson_count: checked })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Description Toggle + Textarea */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mostrar Descrição</Label>
              <p className="text-xs text-muted-foreground">
                Exibe uma descrição abaixo das stats
              </p>
            </div>
            <Switch
              checked={showDescription}
              onCheckedChange={(checked) => onUpdate({ show_description: checked })}
            />
          </div>
          
          {showDescription && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <Textarea
                value={settings.description || ''}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Descrição do curso..."
                maxLength={FIXED_HEADER_LIMITS.DESCRIPTION_MAX}
                rows={3}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Se vazio, usa a descrição do produto
                </p>
                <span className="text-xs text-muted-foreground">
                  {(settings.description || '').length}/{FIXED_HEADER_LIMITS.DESCRIPTION_MAX}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CTA Button Toggle + Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mostrar Botão CTA</Label>
              <p className="text-xs text-muted-foreground">
                Botão de ação principal
              </p>
            </div>
            <Switch
              checked={showCtaButton}
              onCheckedChange={(checked) => onUpdate({ show_cta_button: checked })}
            />
          </div>
          
          {showCtaButton && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <Input
                value={settings.cta_button_text || 'Começar a Assistir'}
                onChange={(e) => onUpdate({ cta_button_text: e.target.value })}
                placeholder="Começar a Assistir"
                maxLength={FIXED_HEADER_LIMITS.CTA_BUTTON_TEXT_MAX}
              />
              <div className="flex justify-end">
                <span className="text-xs text-muted-foreground">
                  {(settings.cta_button_text || '').length}/{FIXED_HEADER_LIMITS.CTA_BUTTON_TEXT_MAX}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== VISUAL SECTION ========== */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-medium text-muted-foreground">Visual</h4>
        
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
      </div>

      {/* ========== GRADIENT SECTION ========== */}
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
