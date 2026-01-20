/**
 * GatewayConfigSheet Component
 * 
 * @module modules/financeiro/components
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Sheet lateral para configuração de gateway.
 * Renderiza o ConfigForm apropriado baseado no gateway selecionado.
 */

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { GATEWAY_REGISTRY } from "@/config/gateways";
import type { GatewayId } from "@/config/gateways/types";

// Gateway ConfigForms
import * as PushinPay from "@/integrations/gateways/pushinpay";
import * as MercadoPago from "@/integrations/gateways/mercadopago";
import * as Stripe from "@/integrations/gateways/stripe";
import * as Asaas from "@/integrations/gateways/asaas";

// ============================================================================
// TYPES
// ============================================================================

interface GatewayConfigSheetProps {
  readonly open: boolean;
  readonly gatewayId: GatewayId | null;
  readonly onClose: () => void;
  readonly onConnectionChange: () => void;
}

// ============================================================================
// CONFIG FORM RENDERER
// ============================================================================

function renderGatewayContent(
  gatewayId: GatewayId | null,
  onConnectionChange: () => void
) {
  switch (gatewayId) {
    case "asaas":
      return <Asaas.ConfigForm onConnectionChange={onConnectionChange} />;
    case "pushinpay":
      return <PushinPay.ConfigForm onConnectionChange={onConnectionChange} />;
    case "mercadopago":
      return <MercadoPago.ConfigForm onConnectionChange={onConnectionChange} />;
    case "stripe":
      return <Stripe.ConfigForm onConnectionChange={onConnectionChange} />;
    default:
      return null;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GatewayConfigSheet({
  open,
  gatewayId,
  onClose,
  onConnectionChange,
}: GatewayConfigSheetProps) {
  const gateway = gatewayId ? GATEWAY_REGISTRY[gatewayId] : null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{gateway?.name ?? ""}</SheetTitle>
          <SheetDescription>{gateway?.description ?? ""}</SheetDescription>
        </SheetHeader>
        {renderGatewayContent(gatewayId, onConnectionChange)}
      </SheetContent>
    </Sheet>
  );
}
