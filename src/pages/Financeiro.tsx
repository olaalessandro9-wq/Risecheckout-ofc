/**
 * Financeiro - Página de configuração de gateways para Vendors
 * 
 * Esta página é exclusiva para Vendors (user/seller).
 * O Owner tem sua própria página: OwnerGateways.tsx
 * 
 * RISE Protocol V2 Compliant - Refactored from 353 → ~90 lines
 */

import { Loader2, Wallet, CreditCard } from "lucide-react";
import * as PushinPay from "@/integrations/gateways/pushinpay";
import * as MercadoPago from "@/integrations/gateways/mercadopago";
import * as Stripe from "@/integrations/gateways/stripe";
import * as Asaas from "@/integrations/gateways/asaas";
import { PaymentCard } from "@/components/financeiro/PaymentCard";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useFinanceiro } from "./financeiro/hooks/useFinanceiro";
import type { GatewayConfig } from "./financeiro/types";

export default function Financeiro() {
  const { state, actions } = useFinanceiro();

  // Gateway configuration
  const gatewayConfig: GatewayConfig[] = [
    {
      id: "asaas",
      name: "Asaas",
      description: "PIX e Cartão de Crédito",
      icon: CreditCard,
      iconColor: "#00B4D8",
      connected: state.asaasConnected,
    },
    {
      id: "pushinpay",
      name: "PushinPay",
      description: "Gateway de pagamento PIX",
      icon: Wallet,
      iconColor: "#3b82f6",
      connected: state.pushinPayConnected,
    },
    {
      id: "mercadopago",
      name: "Mercado Pago",
      description: "PIX e Cartão de Crédito",
      icon: CreditCard,
      iconColor: "#009EE3",
      connected: state.mercadoPagoConnected,
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Cartão de Crédito e PIX",
      icon: CreditCard,
      iconColor: "#635BFF",
      connected: state.stripeConnected,
    },
  ];

  const selectedConfig = gatewayConfig.find(g => g.id === state.selectedGateway);

  const renderGatewayContent = () => {
    switch (state.selectedGateway) {
      case "asaas":
        return <Asaas.ConfigForm onConnectionChange={actions.loadAllIntegrationsDebounced} />;
      case "pushinpay":
        return <PushinPay.ConfigForm onConnectionChange={actions.loadAllIntegrationsDebounced} />;
      case "mercadopago":
        return <MercadoPago.ConfigForm onConnectionChange={actions.loadAllIntegrationsDebounced} />;
      case "stripe":
        return <Stripe.ConfigForm onConnectionChange={actions.loadAllIntegrationsDebounced} />;
      default:
        return null;
    }
  };

  if (state.loadingData) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1 text-foreground">Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Configure suas integrações de pagamento
        </p>
      </div>

      <div className="max-w-3xl space-y-3">
        {gatewayConfig.map((gateway) => (
          <PaymentCard
            key={gateway.id}
            name={gateway.name}
            description={gateway.description}
            icon={gateway.icon}
            iconColor={gateway.iconColor}
            connected={gateway.connected}
            onClick={() => actions.setSelectedGateway(gateway.id)}
          />
        ))}
      </div>

      <Sheet 
        open={state.selectedGateway !== null} 
        onOpenChange={(open) => !open && actions.setSelectedGateway(null)}
      >
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedConfig?.name || ""}</SheetTitle>
            <SheetDescription>{selectedConfig?.description || ""}</SheetDescription>
          </SheetHeader>
          {renderGatewayContent()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
