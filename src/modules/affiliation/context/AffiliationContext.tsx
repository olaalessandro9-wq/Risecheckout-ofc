/**
 * AffiliationContext
 * 
 * React Context Provider for Affiliation State Machine.
 * Provides centralized state management and actions.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 * @module affiliation/context
 */

import React, { createContext, useContext, useEffect } from "react";
import { useMachine } from "@xstate/react";
import { 
  affiliationMachine, 
  type AffiliationTabId,
} from "../machines";
import type { AffiliationDetails, OtherProducerProduct } from "@/hooks/useAffiliationDetails";

// ============================================================================
// CONTEXT VALUE TYPE
// ============================================================================

interface AffiliationContextValue {
  // State
  state: "idle" | "loading" | "ready" | "error";
  activeTab: AffiliationTabId;
  tabErrors: Partial<Record<AffiliationTabId, boolean>>;
  
  // Data
  affiliation: AffiliationDetails | null;
  otherProducts: OtherProducerProduct[];
  isLoading: boolean;
  error: string | null;
  affiliationId: string | undefined;
  
  // Actions
  setActiveTab: (tab: AffiliationTabId) => void;
  setTabError: (tab: AffiliationTabId, hasError: boolean) => void;
  clearTabErrors: () => void;
  refetch: () => Promise<void>; // Explicitly returns Promise<void>
}

// ============================================================================
// CONTEXT
// ============================================================================

const AffiliationContext = createContext<AffiliationContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface AffiliationProviderProps {
  affiliationId: string | undefined;
  children: React.ReactNode;
}

export function AffiliationProvider({ affiliationId, children }: AffiliationProviderProps) {
  const [snapshot, send] = useMachine(affiliationMachine);

  // Load affiliation when affiliationId changes
  useEffect(() => {
    if (affiliationId) {
      send({ type: "LOAD", affiliationId });
    }
  }, [affiliationId, send]);

  // Derive state name
  const stateName = (
    snapshot.matches("idle") ? "idle" :
    snapshot.matches("loading") ? "loading" :
    snapshot.matches("error") ? "error" :
    "ready"
  ) as "idle" | "loading" | "ready" | "error";

  // Create context value
  const contextValue: AffiliationContextValue = {
    // State
    state: stateName,
    activeTab: snapshot.context.activeTab,
    tabErrors: snapshot.context.tabErrors,
    
    // Data
    affiliation: snapshot.context.affiliation,
    otherProducts: snapshot.context.otherProducts,
    isLoading: snapshot.matches("loading"),
    error: snapshot.context.loadError,
    affiliationId,
    
    // Actions
    setActiveTab: (tab) => send({ type: "SET_TAB", tab }),
    setTabError: (tab, hasError) => send({ type: "SET_TAB_ERROR", tab, hasError }),
    clearTabErrors: () => send({ type: "CLEAR_TAB_ERRORS" }),
    refetch: (): Promise<void> => {
      if (affiliationId) {
        send({ type: "REFRESH" });
      }
      return Promise.resolve();
    },
  };

  return (
    <AffiliationContext.Provider value={contextValue}>
      {children}
    </AffiliationContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useAffiliationContext(): AffiliationContextValue {
  const context = useContext(AffiliationContext);
  if (!context) {
    throw new Error("useAffiliationContext must be used within an AffiliationProvider");
  }
  return context;
}
