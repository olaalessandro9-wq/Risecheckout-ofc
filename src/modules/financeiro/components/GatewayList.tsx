/**
 * GatewayList Component
 * 
 * @module modules/financeiro/components
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Lista de gateways disponíveis para configuração.
 * Consome dados do Gateway Registry (SSOT).
 */

import { PaymentCard } from "@/components/financeiro/PaymentCard";
import { GATEWAY_REGISTRY, GATEWAY_ORDER } from "@/config/gateways";
import type { GatewayId, GatewayConnectionMap } from "@/config/gateways/types";

// ============================================================================
// TYPES
// ============================================================================

interface GatewayListProps {
  readonly connectionStatuses: GatewayConnectionMap;
  readonly onSelect: (gatewayId: GatewayId) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GatewayList({ connectionStatuses, onSelect }: GatewayListProps) {
  return (
    <div className="max-w-3xl space-y-3">
      {GATEWAY_ORDER.map((gatewayId) => {
        const gateway = GATEWAY_REGISTRY[gatewayId];
        const status = connectionStatuses[gatewayId];

        return (
          <PaymentCard
            key={gatewayId}
            name={gateway.name}
            description={gateway.description}
            icon={gateway.icon}
            iconColor={gateway.iconColor}
            connected={status.connected}
            status={gateway.status}
            onClick={() => onSelect(gatewayId)}
          />
        );
      })}
    </div>
  );
}
