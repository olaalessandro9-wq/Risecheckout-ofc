/**
 * SettingsThemeSection - Configurações de tema da área de membros
 */

import { Palette } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MembersAreaSettingsData } from "./types";

interface SettingsThemeSectionProps {
  settings: MembersAreaSettingsData;
  onChange: (updates: Partial<MembersAreaSettingsData>) => void;
  disabled?: boolean;
}

export function SettingsThemeSection({ settings, onChange, disabled }: SettingsThemeSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Aparência
        </CardTitle>
        <CardDescription>
          Personalize a aparência da área de membros
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Layout Style */}
        <div className="space-y-2">
          <Label>Estilo de Layout</Label>
          <Select
            value={settings.layout_style}
            onValueChange={(value) => onChange({ layout_style: value as MembersAreaSettingsData["layout_style"] })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estilo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="netflix">Netflix (Carrossel)</SelectItem>
              <SelectItem value="classic">Clássico (Lista)</SelectItem>
              <SelectItem value="grid">Grid (Cards)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Define como os módulos serão exibidos para os alunos
          </p>
        </div>

        {/* Primary Color */}
        <div className="space-y-2">
          <Label>Cor Primária</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={settings.primary_color}
              onChange={(e) => onChange({ primary_color: e.target.value })}
              className="w-16 h-10 p-1 cursor-pointer"
              disabled={disabled}
            />
            <Input
              type="text"
              value={settings.primary_color}
              onChange={(e) => onChange({ primary_color: e.target.value })}
              placeholder="#3B82F6"
              className="flex-1"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Dark Mode */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Modo Escuro</Label>
            <p className="text-xs text-muted-foreground">
              Habilitar tema escuro por padrão
            </p>
          </div>
          <Switch
            checked={settings.dark_mode_enabled}
            onCheckedChange={(checked) => onChange({ dark_mode_enabled: checked })}
            disabled={disabled}
          />
        </div>

        {/* Custom Logo */}
        <div className="space-y-2">
          <Label>Logo Personalizado</Label>
          <Input
            type="url"
            value={settings.custom_logo_url || ""}
            onChange={(e) => onChange({ custom_logo_url: e.target.value || null })}
            placeholder="https://exemplo.com/logo.png"
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            URL da imagem do logo para a área de membros
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
