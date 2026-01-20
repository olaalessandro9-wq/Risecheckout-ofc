/**
 * OwnerGateways - Página exclusiva para Owner
 * 
 * Exibe os gateways de pagamento da plataforma com status fixo:
 * - "Integrado via Secrets" (credenciais vêm das secrets do sistema)
 * - "Produção" (sempre em produção)
 * 
 * RISE Protocol V3 Compliant - Consumes Gateway Registry (SSOT)
 * Refactored: ~90 → ~50 lines (44% reduction)
 */

import { Shield } from "lucide-react";
import { OwnerGatewayCard } from "@/components/financeiro/OwnerGatewayCard";
import { GATEWAY_REGISTRY, GATEWAY_ORDER } from "@/config/gateways";

// ============================================================================
// COMPONENT
// ============================================================================

export default function OwnerGateways() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Gateways da Plataforma
            </h1>
            <p className="text-sm text-muted-foreground">
              Credenciais configuradas via Secrets do sistema
            </p>
          </div>
        </div>
      </div>

      {/* Aviso de Segurança */}
      <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Modo Owner:</span>{" "}
          As credenciais dos gateways são gerenciadas via Secrets do sistema.
          Todos os gateways estão sempre em modo Produção para processamento real de pagamentos.
        </p>
      </div>

      {/* Lista de Gateways - consuming from Registry */}
      <div className="max-w-3xl space-y-3">
        {GATEWAY_ORDER.map((gatewayId) => {
          const gateway = GATEWAY_REGISTRY[gatewayId];
          return (
            <OwnerGatewayCard
              key={gatewayId}
              name={gateway.name}
              description={gateway.description}
              icon={gateway.icon}
              iconColor={gateway.iconColor}
            />
          );
        })}
      </div>
    </div>
  );
}
