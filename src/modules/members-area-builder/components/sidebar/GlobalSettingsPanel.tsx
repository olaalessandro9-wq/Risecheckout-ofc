/**
 * Global Settings Panel - Configurações globais da área de membros
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MembersAreaBuilderSettings } from '../../types/builder.types';

interface GlobalSettingsPanelProps {
  settings: MembersAreaBuilderSettings;
  onUpdate: (settings: Partial<MembersAreaBuilderSettings>) => void;
}

export function GlobalSettingsPanel({ settings, onUpdate }: GlobalSettingsPanelProps) {
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
                <SelectItem value="dark">Escuro</SelectItem>
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
