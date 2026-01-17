/**
 * SupportContact - Seção de informações de suporte
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AffiliateSettings } from "../../../types/product.types";
import type { OnChangeHandler } from "../types";

interface SupportContactProps {
  settings: AffiliateSettings;
  onChange: OnChangeHandler;
}

export function SupportContact({ settings, onChange }: SupportContactProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Informações para Afiliados</h3>
        <p className="text-sm text-muted-foreground">
          Dados que serão exibidos na página pública de afiliação
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supportEmail">E-mail de Suporte</Label>
        <Input
          id="supportEmail"
          type="email"
          placeholder="suporte@seusite.com"
          value={settings.supportEmail || ""}
          onChange={(e) => onChange('supportEmail', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          E-mail para afiliados entrarem em contato com dúvidas
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="publicDescription">Descrição Pública</Label>
        <Textarea
          id="publicDescription"
          placeholder="Descreva seu programa de afiliados, benefícios, materiais de divulgação disponíveis..."
          value={settings.publicDescription || ""}
          onChange={(e) => onChange('publicDescription', e.target.value)}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Será exibida na página pública de solicitação de afiliação
        </p>
      </div>
    </div>
  );
}
