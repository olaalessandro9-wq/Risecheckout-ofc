/**
 * AdvancedRules - Seção de regras avançadas
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import type { AffiliateSettings } from "../../../types/product.types";
import type { OnChangeHandler } from "../types";

interface AdvancedRulesProps {
  settings: AffiliateSettings;
  onChange: OnChangeHandler;
}

export function AdvancedRules({ settings, onChange }: AdvancedRulesProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Regras Avançadas</h3>
        <p className="text-sm text-muted-foreground">
          Configure comissões em produtos adicionais e aprovação de afiliados
        </p>
      </div>

      {/* Switches */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="requireApproval">Exigir aprovação para novos afiliados</Label>
            <p className="text-sm text-muted-foreground">
              Você precisará aprovar manualmente cada novo afiliado
            </p>
          </div>
          <Switch 
            id="requireApproval"
            checked={settings.requireApproval || false}
            onCheckedChange={(checked) => onChange('requireApproval', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="commissionOnOrderBump">Comissão sobre Order Bumps</Label>
            <p className="text-sm text-muted-foreground">
              Afiliado recebe comissão sobre order bumps vendidos
            </p>
          </div>
          <Switch 
            id="commissionOnOrderBump"
            checked={settings.commissionOnOrderBump || false}
            onCheckedChange={(checked) => onChange('commissionOnOrderBump', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="commissionOnUpsell">Comissão sobre Upsells</Label>
            <p className="text-sm text-muted-foreground">
              Afiliado recebe comissão sobre upsells vendidos
            </p>
          </div>
          <Switch 
            id="commissionOnUpsell"
            checked={settings.commissionOnUpsell || false}
            onCheckedChange={(checked) => onChange('commissionOnUpsell', checked)}
          />
        </div>
      </div>

      {/* Alert sobre Split Payment */}
      <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Importante:</strong> Para que os afiliados recebam suas comissões automaticamente, 
          eles precisam conectar suas contas do Mercado Pago. O split de pagamento é feito na fonte, 
          garantindo zero risco de dívidas pendentes.
        </AlertDescription>
      </Alert>
    </div>
  );
}
