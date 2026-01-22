/**
 * SettingsAccessSection - Configurações de acesso da área de membros
 */

import { Shield, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MembersAreaSettingsData } from "./types";

interface SettingsAccessSectionProps {
  settings: MembersAreaSettingsData;
  onChange: (updates: Partial<MembersAreaSettingsData>) => void;
  disabled?: boolean;
}

export function SettingsAccessSection({ settings, onChange, disabled }: SettingsAccessSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Controle de Acesso
        </CardTitle>
        <CardDescription>
          Configure regras de acesso e liberação de conteúdo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drip Content */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Liberação Gradual (Drip)
            </Label>
            <p className="text-xs text-muted-foreground">
              Liberar conteúdo automaticamente ao longo do tempo
            </p>
          </div>
          <Switch
            checked={settings.drip_enabled}
            onCheckedChange={(checked) => onChange({ drip_enabled: checked })}
            disabled={disabled}
          />
        </div>

        {/* Drip Interval */}
        {settings.drip_enabled && (
          <div className="space-y-2 pl-6 border-l-2 border-muted">
            <Label>Intervalo de Liberação</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                value={settings.drip_interval_days}
                onChange={(e) => onChange({ drip_interval_days: parseInt(e.target.value) || 1 })}
                className="w-24"
                disabled={disabled}
              />
              <Select
                value={settings.drip_interval_unit}
                onValueChange={(value) => onChange({ drip_interval_unit: value as MembersAreaSettingsData["drip_interval_unit"] })}
                disabled={disabled}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Dias</SelectItem>
                  <SelectItem value="weeks">Semanas</SelectItem>
                  <SelectItem value="months">Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Intervalo padrão entre liberações de módulos
            </p>
          </div>
        )}

        {/* Require Progress */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Exigir Progresso Sequencial</Label>
            <p className="text-xs text-muted-foreground">
              Aluno precisa completar conteúdo anterior para avançar
            </p>
          </div>
          <Switch
            checked={settings.require_sequential_progress}
            onCheckedChange={(checked) => onChange({ require_sequential_progress: checked })}
            disabled={disabled}
          />
        </div>

        {/* Completion Percentage */}
        <div className="space-y-2">
          <Label>Percentual para Conclusão</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={100}
              value={settings.completion_percentage}
              onChange={(e) => onChange({ completion_percentage: Math.min(100, Math.max(1, parseInt(e.target.value) || 80)) })}
              className="w-24"
              disabled={disabled}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Progresso mínimo necessário para marcar conteúdo como concluído
          </p>
        </div>

        {/* Allow Download */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Permitir Download de Materiais</Label>
            <p className="text-xs text-muted-foreground">
              Alunos podem baixar arquivos complementares
            </p>
          </div>
          <Switch
            checked={settings.allow_downloads}
            onCheckedChange={(checked) => onChange({ allow_downloads: checked })}
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
