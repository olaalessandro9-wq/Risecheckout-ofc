/**
 * Financeiro Context
 * 
 * @module modules/financeiro/context
 * @version 2.0.0 - RISE Protocol V3 Compliant - SSOT Architecture
 * 
 * React Context que integra a financeiroMachine com a UI.
 * Single Source of Truth para todos os estados de conexão de gateways.
 */

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useMachine } from "@xstate/react";
import { useSearchParams } from "react-router-dom";
import { financeiroMachine } from "../machines";
import type { GatewayId } from "@/config/gateways/types";
import type { FinanceiroMachineContext, FinanceiroMachineEvent } from "../machines";

// ============================================================================
// TYPES
// ============================================================================

interface FinanceiroContextValue {
  /** Estado atual da máquina */
  readonly state: {
    readonly value: string;
    readonly context: FinanceiroMachineContext;
    readonly matches: (value: string) => boolean;
  };
  /** Função para enviar eventos */
  readonly send: (event: FinanceiroMachineEvent) => void;
  /** Helpers derivados */
  readonly isLoading: boolean;
  readonly isReady: boolean;
  readonly isError: boolean;
  readonly selectedGateway: GatewayId | null;
  readonly connectionStatuses: FinanceiroMachineContext["connectionStatuses"];
}

// ============================================================================
// CONTEXT
// ============================================================================

const FinanceiroContext = createContext<FinanceiroContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface FinanceiroProviderProps {
  readonly children: ReactNode;
}

export function FinanceiroProvider({ children }: FinanceiroProviderProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, send] = useMachine(financeiroMachine);
  
  // Debounce ref para evitar processar múltiplos postMessages
  const lastOAuthMessageTime = useRef<number>(0);

  // Auto-load on mount
  useEffect(() => {
    if (state.matches("idle")) {
      send({ type: "LOAD" });
    }
  }, [state, send]);

  // Auto-open gateway from URL param
  useEffect(() => {
    if (state.matches("ready")) {
      const gatewayParam = searchParams.get("gateway");
      const validGateways: GatewayId[] = ["asaas", "pushinpay", "mercadopago", "stripe"];

      if (gatewayParam && validGateways.includes(gatewayParam as GatewayId)) {
        send({ type: "SELECT_GATEWAY", gatewayId: gatewayParam as GatewayId });
        setSearchParams({}, { replace: true });
      }
    }
  }, [state, searchParams, setSearchParams, send]);

  // OAuth message listener - SSOT: único local que dispara refresh
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const messageType = event.data?.type;
      const isOAuthSuccess =
        messageType === "mercadopago_oauth_success" ||
        messageType === "mercadopago-connected" ||
        messageType === "stripe_oauth_success" ||
        messageType === "asaas_oauth_success" ||
        messageType === "oauth_success";

      if (isOAuthSuccess && (state.matches("ready") || state.matches("backgroundRefreshing"))) {
        // DEBOUNCE: ignorar mensagens duplicadas em < 5s
        const now = Date.now();
        if (now - lastOAuthMessageTime.current < 5000) {
          return; // Ignorar duplicata
        }
        lastOAuthMessageTime.current = now;
        
        // Delay para garantir que o backend processou completamente
        // Usa BACKGROUND_REFRESH para não bloquear a UI com spinner
        setTimeout(() => send({ type: "BACKGROUND_REFRESH" }), 1500);
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [state, send]);

  const value: FinanceiroContextValue = {
    state: {
      value: state.value as string,
      context: state.context,
      matches: state.matches,
    },
    send,
    isLoading: state.matches("loading"),
    isReady: state.matches("ready"),
    isError: state.matches("error"),
    selectedGateway: state.context.selectedGateway,
    connectionStatuses: state.context.connectionStatuses,
  };

  return (
    <FinanceiroContext.Provider value={value}>
      {children}
    </FinanceiroContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useFinanceiroContext(): FinanceiroContextValue {
  const context = useContext(FinanceiroContext);
  
  if (!context) {
    throw new Error("useFinanceiroContext must be used within FinanceiroProvider");
  }
  
  return context;
}
