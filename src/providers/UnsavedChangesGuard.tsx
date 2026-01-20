/**
 * UnsavedChangesGuard - Componente para proteger páginas com alterações não salvas
 * 
 * Usa o NavigationGuardProvider centralizado para registrar o estado dirty.
 * O modal de confirmação é gerenciado pelo provider, não por este componente.
 * 
 * Uso:
 * <UnsavedChangesGuard isDirty={hasUnsavedChanges} id="product-form">
 *   <YourComponent />
 * </UnsavedChangesGuard>
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Nota 9.7/10
 */

import { useId, type PropsWithChildren } from "react";
import { useFormDirtyGuard } from "@/hooks/useFormDirtyGuard";

// ============================================================================
// TYPES
// ============================================================================

interface UnsavedChangesGuardProps extends PropsWithChildren {
  /** Se há alterações não salvas */
  isDirty: boolean;
  /** ID único para este guard (opcional, usa useId se não fornecido) */
  id?: string;
  /** @deprecated - Título agora é gerenciado pelo NavigationGuardProvider */
  title?: string;
  /** @deprecated - Descrição agora é gerenciada pelo NavigationGuardProvider */
  description?: string;
  /** @deprecated - Texto do botão cancelar agora é gerenciado pelo NavigationGuardProvider */
  cancelText?: string;
  /** @deprecated - Texto do botão confirmar agora é gerenciado pelo NavigationGuardProvider */
  confirmText?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function UnsavedChangesGuard({
  children,
  isDirty,
  id,
}: UnsavedChangesGuardProps) {
  // Gera ID único se não fornecido
  const autoId = useId();
  const guardId = id ?? autoId;
  
  // Registra no sistema centralizado
  useFormDirtyGuard({ id: guardId, isDirty });
  
  // Apenas renderiza children - modal é gerenciado pelo provider
  return <>{children}</>;
}
