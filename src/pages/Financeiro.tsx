/**
 * Financeiro - Página de configuração de gateways para Vendors
 * 
 * Esta página é exclusiva para Vendors (user/seller).
 * O Owner tem sua própria página: OwnerGateways.tsx
 * 
 * RISE Protocol V3 Compliant - XState Architecture
 * Refactored: ~90 → ~45 lines (50% reduction)
 */

import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FinanceiroProvider,
  useFinanceiroContext,
  GatewayList,
  GatewayConfigSheet,
} from "@/modules/financeiro";

// ============================================================================
// INNER COMPONENT (consumes context)
// ============================================================================

function FinanceiroContent() {
  const { 
    isLoading, 
    isError, 
    connectionStatuses, 
    selectedGateway,
    state,
    send,
  } = useFinanceiroContext();

  // Só mostra loading fullscreen no carregamento inicial, não no background refresh
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">{state.context.loadError}</p>
        <Button onClick={() => send({ type: "RETRY" })}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <>
      <GatewayList
        connectionStatuses={connectionStatuses}
        onSelect={(gatewayId) => send({ type: "SELECT_GATEWAY", gatewayId })}
      />

      <GatewayConfigSheet
        open={selectedGateway !== null}
        gatewayId={selectedGateway}
        onClose={() => send({ type: "DESELECT_GATEWAY" })}
        onConnectionChange={() => send({ type: "REFRESH" })}
      />
    </>
  );
}

// ============================================================================
// PAGE COMPONENT (provides context)
// ============================================================================

export default function Financeiro() {
  return (
    <FinanceiroProvider>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            Configure suas integrações de pagamento
          </p>
        </div>

        <FinanceiroContent />
      </div>
    </FinanceiroProvider>
  );
}
