/**
 * Banner Editor - Editor de configurações do banner
 * Gradient controls removed: now managed globally via GlobalSettingsPanel
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { ImageUploadWithCrop } from '../../shared/ImageUploadWithCrop';
import { BANNER_UPLOAD_CONFIG } from '../../shared/imageUploadConfigs';
import type { Section, BannerSettings, BannerSlide } from '../../../types';

interface BannerEditorProps {
  section: Section;
  onUpdate: (settings: Partial<BannerSettings>) => void;
  productId?: string;
}

export function BannerEditor({ section, onUpdate, productId }: BannerEditorProps) {
  const settings = section.settings as BannerSettings;
  const slides = settings.slides || [];

  const addSlide = () => {
    const newSlide: BannerSlide = {
      id: crypto.randomUUID(),
      image_url: '',
      link: '',
      alt: '',
    };
    onUpdate({ slides: [...slides, newSlide] });
  };

  const updateSlide = (index: number, updates: Partial<BannerSlide>) => {
    const updated = slides.map((slide, i) => 
      i === index ? { ...slide, ...updates } : slide
    );
    onUpdate({ slides: updated });
  };

  const removeSlide = (index: number) => {
    onUpdate({ slides: slides.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      {/* Slides */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Slides ({slides.length}/3)</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={addSlide}
            disabled={slides.length >= 3}
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar
          </Button>
        </div>

        <div className="space-y-3">
          {slides.map((slide, index) => (
            <div 
              key={slide.id} 
              className="border rounded-lg p-3 space-y-3 bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <span className="text-sm font-medium">Slide {index + 1}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => removeSlide(index)}
                  disabled={slides.length <= 1}
                  title={slides.length <= 1 ? 'Mínimo 1 slide obrigatório' : 'Remover slide'}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {/* Image Upload */}
              <ImageUploadWithCrop
                imageUrl={slide.image_url}
                originalImageUrl={slide.original_image_url}
                productId={productId}
                onImageChange={(url, originalUrl) =>
                  updateSlide(index, { image_url: url, original_image_url: originalUrl })
                }
                config={BANNER_UPLOAD_CONFIG}
              />

              <Input
                placeholder="Link (opcional)"
                value={slide.link || ''}
                onChange={(e) => updateSlide(index, { link: e.target.value })}
              />

              <Input
                placeholder="Texto alternativo (alt)"
                value={slide.alt || ''}
                onChange={(e) => updateSlide(index, { alt: e.target.value })}
              />
            </div>
          ))}

          {slides.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Adicione slides ao seu banner
            </p>
          )}
        </div>
      </div>

      {/* Height */}
      <div className="space-y-2">
        <Label>Altura</Label>
        <Select
          value={settings.height || 'medium'}
          onValueChange={(value: 'small' | 'medium' | 'large') => onUpdate({ height: value })}
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

      {/* Transition Time */}
      <div className="space-y-2">
        <Label>Tempo de Transição (segundos)</Label>
        <Input
          type="number"
          min={1}
          max={30}
          value={settings.transition_seconds || 5}
          onChange={(e) => onUpdate({ transition_seconds: parseInt(e.target.value) || 5 })}
        />
      </div>
    </div>
  );
}
