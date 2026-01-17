/**
 * CommissionSettings - Seção de configurações de comissão
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AffiliateSettings } from "../../../types/product.types";
import type { OnChangeHandler } from "../types";

interface CommissionSettingsProps {
  settings: AffiliateSettings;
  onChange: OnChangeHandler;
}

export function CommissionSettings({ settings, onChange }: CommissionSettingsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Comissão e Atribuição</h3>
        <p className="text-sm text-muted-foreground">
          Defina quanto e como os afiliados serão remunerados
        </p>
      </div>

      {/* Comissão Padrão */}
      <div className="space-y-2">
        <Label htmlFor="defaultRate">Comissão Padrão</Label>
        <div className="relative max-w-xs">
          <Input
            id="defaultRate"
            type="number"
            min="1"
            max="90"
            step="1"
            value={settings.defaultRate}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value)) {
                onChange('defaultRate', Math.min(90, Math.max(1, value)));
              }
            }}
            className="pr-8"
          />
          <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Porcentagem que o afiliado receberá sobre cada venda (1% - 100%)
        </p>
      </div>

      {/* Grid de Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Duração do Cookie */}
        <div className="space-y-2">
          <Label htmlFor="cookieDuration">Duração do Cookie</Label>
          <Select 
            value={String(settings.cookieDuration)} 
            onValueChange={(val) => onChange('cookieDuration', Number(val))}
          >
            <SelectTrigger id="cookieDuration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Dia</SelectItem>
              <SelectItem value="7">7 Dias (1 semana)</SelectItem>
              <SelectItem value="30">30 Dias (1 mês)</SelectItem>
              <SelectItem value="60">60 Dias (2 meses)</SelectItem>
              <SelectItem value="90">90 Dias (3 meses)</SelectItem>
              <SelectItem value="180">180 Dias (6 meses)</SelectItem>
              <SelectItem value="365">365 Dias (1 ano)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Tempo de validade do link após o clique
          </p>
        </div>

        {/* Modelo de Atribuição */}
        <div className="space-y-2">
          <Label htmlFor="attributionModel">Modelo de Atribuição</Label>
          <Select 
            value={settings.attributionModel} 
            onValueChange={(val) => onChange('attributionModel', val)}
          >
            <SelectTrigger id="attributionModel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_click">Último Clique</SelectItem>
              <SelectItem value="first_click">Primeiro Clique</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Qual afiliado recebe a comissão
          </p>
        </div>
      </div>
    </div>
  );
}
