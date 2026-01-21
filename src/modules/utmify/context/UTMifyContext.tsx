/**
 * UTMify Context - Provider + Hook
 * 
 * Wraps XState machine and exposes state + actions to components.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Context Pattern
 */

import { createContext, useContext, useEffect, useMemo } from "react";
import { useMachine } from "@xstate/react";
import { utmifyMachine } from "../machines";
import type { UTMifyStateValue } from "../machines";
import type { Product } from "../types";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import type { VaultSaveResponse } from "../types";
import { toast } from "sonner";

// ============================================================================
// CONTEXT VALUE TYPE
// ============================================================================

interface UTMifyContextValue {
  // State
  readonly isLoading: boolean;
  readonly isReady: boolean;
  readonly isSaving: boolean;
  readonly isError: boolean;
  readonly error: string | null;
  
  // Data
  readonly products: Product[];
  readonly token: string;
  readonly active: boolean;
  readonly selectedProducts: string[];
  readonly selectedEvents: string[];
  readonly hasExistingToken: boolean;
  
  // Actions
  readonly updateToken: (token: string) => void;
  readonly toggleActive: () => void;
  readonly toggleProduct: (productId: string) => void;
  readonly toggleEvent: (eventId: string) => void;
  readonly save: () => Promise<void>;
  readonly refresh: () => void;
  
  // Machine state check
  readonly matches: (value: UTMifyStateValue) => boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const UTMifyContext = createContext<UTMifyContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface UTMifyProviderProps {
  children: React.ReactNode;
}

export function UTMifyProvider({ children }: UTMifyProviderProps) {
  const { user } = useAuth();
  const [state, send] = useMachine(utmifyMachine);

  // Auto-load on mount when user is available
  useEffect(() => {
    if (user && state.matches("idle")) {
      send({ type: "LOAD" });
    }
  }, [user, state, send]);

  // Derived states
  const isLoading = state.matches("loading");
  const isReady = state.matches("ready");
  const isSaving = state.matches("saving");
  const isError = state.matches("error");

  // Save handler with vendor ID injection
  const save = async () => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    const { token, active, selectedProducts, selectedEvents, config } = state.context;
    
    if (!token.trim() && !config?.hasToken) {
      toast.error("API Token é obrigatório");
      return;
    }

    try {
      const shouldActivate = !config?.hasToken && !active && token.trim();
      const activeStatus = shouldActivate ? true : active;

      const credentials: Record<string, unknown> = {
        selected_products: selectedProducts,
        selected_events: selectedEvents,
        has_token: true,
      };

      if (token.trim()) {
        credentials.api_token = token.trim();
      }

      const { data, error } = await api.call<VaultSaveResponse>("vault-save", {
        vendor_id: user.id,
        integration_type: "UTMIFY",
        credentials,
        active: activeStatus,
      });

      if (error) throw new Error(error.message || "Erro ao salvar credenciais");
      if (!data?.success) throw new Error(data?.error || "Erro ao salvar credenciais");

      // Update local state after successful save
      send({ type: "LOAD" }); // Reload to get fresh state
      toast.success("Integração UTMify salva com sucesso!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Erro ao salvar: " + errorMessage);
    }
  };

  // Context value
  const value = useMemo<UTMifyContextValue>(() => ({
    // State
    isLoading,
    isReady,
    isSaving,
    isError,
    error: state.context.error,
    
    // Data
    products: state.context.products,
    token: state.context.token,
    active: state.context.active,
    selectedProducts: state.context.selectedProducts,
    selectedEvents: state.context.selectedEvents,
    hasExistingToken: state.context.config?.hasToken || false,
    
    // Actions
    updateToken: (token: string) => send({ type: "UPDATE_TOKEN", token }),
    toggleActive: () => send({ type: "TOGGLE_ACTIVE" }),
    toggleProduct: (productId: string) => send({ type: "TOGGLE_PRODUCT", productId }),
    toggleEvent: (eventId: string) => send({ type: "TOGGLE_EVENT", eventId }),
    save,
    refresh: () => send({ type: "LOAD" }),
    
    // Machine
    matches: (value: UTMifyStateValue) => state.matches(value),
  }), [state, send, isLoading, isReady, isSaving, isError, user?.id]);

  return (
    <UTMifyContext.Provider value={value}>
      {children}
    </UTMifyContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useUTMifyContext(): UTMifyContextValue {
  const context = useContext(UTMifyContext);
  
  if (!context) {
    throw new Error("useUTMifyContext must be used within UTMifyProvider");
  }
  
  return context;
}
