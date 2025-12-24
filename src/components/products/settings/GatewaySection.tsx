/**
 * Seção de configuração de gateways de pagamento
 */

import { Label } from "@/components/ui/label";
import { Info, AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { GatewaySelector } from "../GatewaySelector";
import { getGatewayById } from "@/config/payment-gateways";
import type { SettingsFormProps, GatewayCredentials } from "./types";

interface GatewaySectionProps extends SettingsFormProps {
  credentials: GatewayCredentials;
}

interface GatewayCredentialStatusProps {
  gatewayId: string;
  isConfigured?: boolean;
  viaSecrets?: boolean;
}

function GatewayCredentialStatus({ gatewayId, isConfigured, viaSecrets }: GatewayCredentialStatusProps) {
  const gateway = getGatewayById(gatewayId);

  if (!gateway?.requiresCredentials) return null;

  // Owner com credenciais via Secrets
  if (viaSecrets) {
    return (
      <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
        <Shield className="h-3.5 w-3.5" />
        Integrado via Secrets
      </div>
    );
  }

  if (isConfigured) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Credenciais configuradas
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
      <AlertCircle className="h-3.5 w-3.5" />
      Credenciais não configuradas - configure na página Financeiro
    </div>
  );
}

export function GatewaySection({ form, setForm, credentials }: GatewaySectionProps) {
  // Detectar se é Owner baseado nas credenciais
  const isOwnerMode = Object.values(credentials).some(c => c?.viaSecrets);

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Gateway de pagamento</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Escolha qual gateway será usado para processar os pagamentos deste produto
        </p>
      </div>

      <div className="space-y-6">
        {/* Gateway de PIX */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">PIX</Label>
          <GatewaySelector
            paymentMethod="pix"
            value={form.pix_gateway}
            onChange={(v) => setForm((f) => ({ ...f, pix_gateway: v }))}
            showComingSoon={true}
            credentials={credentials}
          />
          <GatewayCredentialStatus
            gatewayId={form.pix_gateway}
            isConfigured={credentials[form.pix_gateway as keyof GatewayCredentials]?.configured}
            viaSecrets={credentials[form.pix_gateway as keyof GatewayCredentials]?.viaSecrets}
          />
        </div>

        {/* Gateway de Cartão */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Cartão de Crédito</Label>
          <GatewaySelector
            paymentMethod="credit_card"
            value={form.credit_card_gateway}
            onChange={(v) => setForm((f) => ({ ...f, credit_card_gateway: v }))}
            showComingSoon={true}
            credentials={credentials}
          />
          <GatewayCredentialStatus
            gatewayId={form.credit_card_gateway}
            isConfigured={credentials[form.credit_card_gateway as keyof GatewayCredentials]?.configured}
            viaSecrets={credentials[form.credit_card_gateway as keyof GatewayCredentials]?.viaSecrets}
          />
        </div>
      </div>

      {/* Aviso de Configuração - Não mostrar para Owner */}
      {!isOwnerMode && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Importante:</strong> Certifique-se de configurar suas credenciais
              do gateway escolhido na página <strong>Financeiro</strong> antes de usar.
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
