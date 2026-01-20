/**
 * useFormDirtyGuard - Hook para registrar formulários no NavigationGuardProvider
 * 
 * Conecta o estado dirty de um formulário ao sistema centralizado de proteção
 * de navegação, garantindo que alterações não salvas sejam protegidas.
 * 
 * @see RISE ARCHITECT PROTOCOL V3
 */

import { useEffect } from "react";
import { useNavigationGuard } from "@/providers/NavigationGuardProvider";

// ============================================================================
// TYPES
// ============================================================================

interface UseFormDirtyGuardOptions {
  /** ID único do formulário (usado para tracking) */
  id: string;
  /** Se o formulário tem alterações não salvas */
  isDirty: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function useFormDirtyGuard({ id, isDirty }: UseFormDirtyGuardOptions): void {
  const { registerDirty, unregisterDirty } = useNavigationGuard();

  useEffect(() => {
    registerDirty(id, isDirty);
    
    // Cleanup: remove registro quando componente desmonta
    return () => {
      unregisterDirty(id);
    };
  }, [id, isDirty, registerDirty, unregisterDirty]);
}
