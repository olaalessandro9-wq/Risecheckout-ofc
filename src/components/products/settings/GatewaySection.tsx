/**
 * Seção de configuração de gateways de pagamento
 * Design compacto com ícones contextuais e separador visual
 */

import { QrCode, CreditCard } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { GatewaySelector } from "../GatewaySelector";
import type { SettingsFormProps, GatewayCredentials } from "./types";

interface GatewaySectionProps extends SettingsFormProps {
  credentials: GatewayCredentials;
}

export function GatewaySection({ form, setForm, credentials }: GatewaySectionProps) {
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
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">PIX</span>
          </div>
          <GatewaySelector
            paymentMethod="pix"
            value={form.pix_gateway}
            onChange={(v) => setForm((f) => ({ ...f, pix_gateway: v }))}
            showComingSoon={true}
            credentials={credentials}
          />
        </div>

        <Separator />

        {/* Gateway de Cartão */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Cartão de Crédito</span>
          </div>
          <GatewaySelector
            paymentMethod="credit_card"
            value={form.credit_card_gateway}
            onChange={(v) => setForm((f) => ({ ...f, credit_card_gateway: v }))}
            showComingSoon={true}
            credentials={credentials}
          />
        </div>
      </div>
    </section>
  );
}
