/**
 * Product Form State Machine - Guards
 * 
 * Guards são funções que determinam se uma transição pode ocorrer.
 * Usados para lógica condicional nas transições de estado.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Nota 10/10
 */

import type { ProductFormContext, ProductFormEvent } from "./productFormMachine.types";
import { anyDirty } from "./productFormMachine.helpers";

// ============================================================================
// GUARDS
// ============================================================================

/**
 * Verifica se o formulário tem mudanças não salvas
 */
export function hasDirtyChanges({ context }: { context: ProductFormContext }): boolean {
  return context.isDirty || anyDirty(context.dirtyFlags);
}

/**
 * Verifica se não há mudanças
 */
export function hasNoDirtyChanges({ context }: { context: ProductFormContext }): boolean {
  return !hasDirtyChanges({ context });
}

/**
 * Verifica se tem erros de validação
 */
export function hasValidationErrors({ context }: { context: ProductFormContext }): boolean {
  const { validation } = context;
  
  const hasGeneralErrors = Object.values(validation.general).some(Boolean);
  const hasUpsellErrors = Object.values(validation.upsell).some(Boolean);
  const hasAffiliateErrors = Object.values(validation.affiliate).some(Boolean);
  
  return hasGeneralErrors || hasUpsellErrors || hasAffiliateErrors;
}

/**
 * Verifica se não tem erros de validação
 */
export function hasNoValidationErrors({ context }: { context: ProductFormContext }): boolean {
  return !hasValidationErrors({ context });
}

/**
 * Verifica se pode tentar salvar novamente (limite de 3 tentativas)
 */
export function canRetry({ context }: { context: ProductFormContext }): boolean {
  return context.saveAttempts < 3;
}

/**
 * Verifica se atingiu limite de tentativas
 */
export function hasReachedRetryLimit({ context }: { context: ProductFormContext }): boolean {
  return context.saveAttempts >= 3;
}

/**
 * Verifica se tem produto carregado
 */
export function hasProduct({ context }: { context: ProductFormContext }): boolean {
  return context.serverData.product !== null;
}

/**
 * Verifica se não tem produto
 */
export function hasNoProduct({ context }: { context: ProductFormContext }): boolean {
  return context.serverData.product === null;
}

/**
 * Verifica se tem productId definido
 */
export function hasProductId({ context }: { context: ProductFormContext }): boolean {
  return context.productId !== null && context.productId !== "";
}

/**
 * Verifica se tem userId definido
 */
export function hasUserId({ context }: { context: ProductFormContext }): boolean {
  return context.userId !== null && context.userId !== "";
}

/**
 * Verifica se está pronto para carregar (tem productId e userId)
 */
export function isReadyToLoad({ context }: { context: ProductFormContext }): boolean {
  return hasProductId({ context }) && hasUserId({ context });
}

// ============================================================================
// GUARD MAP (para uso na máquina)
// ============================================================================

export const guards = {
  hasDirtyChanges,
  hasNoDirtyChanges,
  hasValidationErrors,
  hasNoValidationErrors,
  canRetry,
  hasReachedRetryLimit,
  hasProduct,
  hasNoProduct,
  hasProductId,
  hasUserId,
  isReadyToLoad,
};
