/**
 * Tipos do Save Registry Pattern
 * 
 * Exportados separadamente para evitar dependência circular.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

// ============================================================================
// SAVE REGISTRY TYPES
// ============================================================================

/**
 * Função que executa o salvamento
 */
export type SaveHandler = () => Promise<void>;

/**
 * Função que valida antes do salvamento
 */
export type ValidationHandler = () => boolean;

/**
 * Opções ao registrar um handler
 */
export interface RegisterSaveHandlerOptions {
  /** Função de validação (opcional) */
  validate?: ValidationHandler;
  /** Ordem de execução (default: 50) */
  order?: number;
}

/**
 * Tipo da função registerSaveHandler
 */
export type RegisterSaveHandler = (
  key: string,
  save: SaveHandler,
  options?: RegisterSaveHandlerOptions
) => () => void;

/**
 * Tipo da função unregisterSaveHandler
 */
export type UnregisterSaveHandler = (key: string) => void;
