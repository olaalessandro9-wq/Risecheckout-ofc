/**
 * Pixels Context
 * 
 * @module modules/pixels/context
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Conecta a pixelsMachine ao React, fornecendo SSOT para o módulo.
 */

import { createContext, useContext, useEffect } from "react";
import { useMachine } from "@xstate/react";
import { pixelsMachine } from "../machines";
import type { PixelsMachineContext, PixelsMachineEvent } from "../machines/types";
import type { VendorPixel, PixelFormData } from "../types";

// ============================================================================
// TYPES
// ============================================================================

interface PixelsContextValue {
  /** Estado atual da máquina */
  readonly state: {
    readonly value: string;
    readonly context: PixelsMachineContext;
    readonly matches: (value: string) => boolean;
  };
  
  /** Dispatcher de eventos */
  readonly send: (event: PixelsMachineEvent) => void;
  
  // Derived state
  readonly isLoading: boolean;
  readonly isReady: boolean;
  readonly isError: boolean;
  readonly isSaving: boolean;
  
  // Data
  readonly pixels: VendorPixel[];
  readonly editingPixel: VendorPixel | null;
  readonly deletingPixel: VendorPixel | null;
  readonly isFormOpen: boolean;
  readonly error: string | null;
  
  // Actions (helpers)
  readonly openForm: (pixel?: VendorPixel) => void;
  readonly closeForm: () => void;
  readonly savePixel: (data: PixelFormData) => void;
  readonly requestDelete: (pixel: VendorPixel) => void;
  readonly cancelDelete: () => void;
  readonly confirmDelete: () => void;
  readonly refresh: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const PixelsContext = createContext<PixelsContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface PixelsProviderProps {
  readonly children: React.ReactNode;
}

export function PixelsProvider({ children }: PixelsProviderProps) {
  const [state, send] = useMachine(pixelsMachine);

  // Auto-load on mount
  useEffect(() => {
    if (state.matches("idle")) {
      send({ type: "LOAD" });
    }
  }, [state, send]);

  // Derived state
  const isLoading = state.matches("loading");
  const isReady = state.matches("ready");
  const isError = state.matches("error");
  const isSaving = state.matches("saving") || state.matches("deleting");

  // Helper actions
  const openForm = (pixel?: VendorPixel) => {
    send({ type: "OPEN_FORM", pixel });
  };

  const closeForm = () => {
    send({ type: "CLOSE_FORM" });
  };

  const savePixel = (data: PixelFormData) => {
    send({ type: "SAVE_PIXEL", data });
  };

  const requestDelete = (pixel: VendorPixel) => {
    send({ type: "REQUEST_DELETE", pixel });
  };

  const cancelDelete = () => {
    send({ type: "CANCEL_DELETE" });
  };

  const confirmDelete = () => {
    send({ type: "CONFIRM_DELETE" });
  };

  const refresh = () => {
    send({ type: "REFRESH" });
  };

  const value: PixelsContextValue = {
    state: {
      value: String(state.value),
      context: state.context,
      matches: (v: string) => state.matches(v as "idle" | "loading" | "ready" | "saving" | "deleting" | "error"),
    },
    send,
    isLoading,
    isReady,
    isError,
    isSaving,
    pixels: state.context.pixels,
    editingPixel: state.context.editingPixel,
    deletingPixel: state.context.deletingPixel,
    isFormOpen: state.context.isFormOpen,
    error: state.context.error,
    openForm,
    closeForm,
    savePixel,
    requestDelete,
    cancelDelete,
    confirmDelete,
    refresh,
  };

  return (
    <PixelsContext.Provider value={value}>
      {children}
    </PixelsContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function usePixelsContext(): PixelsContextValue {
  const context = useContext(PixelsContext);
  
  if (!context) {
    throw new Error("usePixelsContext must be used within a PixelsProvider");
  }
  
  return context;
}
