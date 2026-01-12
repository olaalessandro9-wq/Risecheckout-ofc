/**
 * Componente: PixelForm
 * Formulário para adicionar/editar um pixel
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlatformIcon } from "./PlatformIcon";
import type { VendorPixel, PixelFormData, PixelPlatform } from "./types";
import { PLATFORM_INFO } from "./types";

interface PixelFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pixel?: VendorPixel | null;
  onSave: (data: PixelFormData) => Promise<void>;
  isSaving: boolean;
}

const PLATFORMS: PixelPlatform[] = ['facebook', 'tiktok', 'google_ads', 'kwai'];

export function PixelForm({ open, onOpenChange, pixel, onSave, isSaving }: PixelFormProps) {
  const [formData, setFormData] = useState<PixelFormData>({
    platform: 'facebook',
    name: '',
    pixel_id: '',
    access_token: '',
    conversion_label: '',
    domain: '',
    is_active: true,
  });

  const isEditing = !!pixel;
  const platformInfo = PLATFORM_INFO[formData.platform];

  // Reset form when opening/closing or pixel changes
  useEffect(() => {
    if (open) {
      if (pixel) {
        setFormData({
          platform: pixel.platform,
          name: pixel.name,
          pixel_id: pixel.pixel_id,
          access_token: pixel.access_token || '',
          conversion_label: pixel.conversion_label || '',
          domain: pixel.domain || '',
          is_active: pixel.is_active,
        });
      } else {
        setFormData({
          platform: 'facebook',
          name: '',
          pixel_id: '',
          access_token: '',
          conversion_label: '',
          domain: '',
          is_active: true,
        });
      }
    }
  }, [open, pixel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const updateField = <K extends keyof PixelFormData>(field: K, value: PixelFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Pixel' : 'Adicionar Pixel'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as configurações do seu pixel de rastreamento.'
              : 'Cadastre um novo pixel para usar em seus produtos.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plataforma */}
          <div className="space-y-2">
            <Label htmlFor="platform">Plataforma *</Label>
            <Select
              value={formData.platform}
              onValueChange={(value: PixelPlatform) => updateField('platform', value)}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a plataforma" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((platform) => (
                  <SelectItem key={platform} value={platform}>
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={platform} size={16} />
                      <span>{PLATFORM_INFO[platform].label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {platformInfo.description}
            </p>
          </div>

          {/* Nome do Pixel */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Pixel *</Label>
            <Input
              id="name"
              placeholder="Ex: Pixel Principal, Remarketing, etc."
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />
          </div>

          {/* Pixel ID */}
          <div className="space-y-2">
            <Label htmlFor="pixel_id">
              {formData.platform === 'google_ads' ? 'Conversion ID *' : 'Pixel ID *'}
            </Label>
            <Input
              id="pixel_id"
              placeholder={
                formData.platform === 'google_ads' 
                  ? 'Ex: AW-123456789' 
                  : 'Ex: 1234567890123456'
              }
              value={formData.pixel_id}
              onChange={(e) => updateField('pixel_id', e.target.value)}
              required
              className="font-mono"
            />
          </div>

          {/* Access Token (Facebook, TikTok) */}
          {platformInfo.requiresAccessToken && (
            <div className="space-y-2">
              <Label htmlFor="access_token">Access Token (Conversions API)</Label>
              <Input
                id="access_token"
                type="password"
                placeholder="Token para Conversions API (opcional)"
                value={formData.access_token}
                onChange={(e) => updateField('access_token', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Necessário para enviar eventos server-side (mais preciso)
              </p>
            </div>
          )}

          {/* Conversion Label (Google Ads) */}
          {platformInfo.requiresConversionLabel && (
            <div className="space-y-2">
              <Label htmlFor="conversion_label">Conversion Label *</Label>
              <Input
                id="conversion_label"
                placeholder="Ex: AbC123dEfG"
                value={formData.conversion_label}
                onChange={(e) => updateField('conversion_label', e.target.value)}
                required={platformInfo.requiresConversionLabel}
              />
            </div>
          )}

          {/* Domain (Facebook) */}
          {platformInfo.requiresDomain && (
            <div className="space-y-2">
              <Label htmlFor="domain">Domínio Verificado</Label>
              <Input
                id="domain"
                placeholder="Ex: seusite.com.br"
                value={formData.domain}
                onChange={(e) => updateField('domain', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Domínio verificado no Facebook Business para eventos de alta prioridade
              </p>
            </div>
          )}

          {/* Status Ativo */}
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Ativo</Label>
              <p className="text-xs text-muted-foreground">
                Pixels inativos não disparam eventos
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => updateField('is_active', checked)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Pixel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
