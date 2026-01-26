/**
 * UTMify Context - Provider + Hook
 * 
 * Wraps XState machine and exposes state + actions to components.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Context Pattern
 * @version 1.1.0 - Lógica de save centralizada no XState
 */

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useMachine } from "@xstate/react";
import { utmifyMachine } from "../machines";
import type { UTMifyStateValue } from "../machines";
import type { Product } from "../types";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
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
  readonly save: () => void;
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
  const { user } = useUnifiedAuth();
  const [state, send] = useMachine(utmifyMachine);
  
  // Track previous state for transition detection
  const prevStateRef = useRef<string | null>(null);

  // Auto-load on mount when user is available
  useEffect(() => {
    if (user && state.matches("idle")) {
      send({ type: "LOAD" });
    }
  }, [user, state, send]);

  // Toast notifications based on machine transitions
  useEffect(() => {
    const currentState = state.value as string;
    const prevState = prevStateRef.current;
    
    // Save succeeded: transitioned from saving to ready
    if (prevState === "saving" && currentState === "ready" && !state.context.error) {
      toast.success("Integração UTMify salva com sucesso!");
      // Reload para sincronizar estado
      send({ type: "LOAD" });
    }
    
    // Save failed: error after saving
    if (prevState === "saving" && state.context.error) {
      toast.error("Erro ao salvar: " + state.context.error);
    }
    
    prevStateRef.current = currentState;
  }, [state, send]);

  // Derived states
  const isLoading = state.matches("loading");
  const isReady = state.matches("ready");
  const isSaving = state.matches("saving");
  const isError = state.matches("error");

  /**
   * Save handler - delega toda lógica ao XState saveActor
   * 
   * Validações simples (user/token) são feitas aqui.
   * Lógica complexa de persistência está centralizada no machine.
   */
  const save = () => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    const { token, config } = state.context;
    
    if (!token.trim() && !config?.hasToken) {
      toast.error("API Token é obrigatório");
      return;
    }

    // Delega ao XState - toda lógica de save está no saveActor
    send({ type: "SAVE", vendorId: user.id });
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
