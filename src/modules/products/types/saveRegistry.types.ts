/**
 * Tipos do Save Registry Pattern (Estendido para Tab Validation)
 * 
 * Exportados separadamente para evitar dependência circular.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type { TabValidationMap, ValidationResultExtended } from "./tabValidation.types";

// ============================================================================
// SAVE REGISTRY TYPES
// ============================================================================

/**
 * Função que executa o salvamento
 */
export type SaveHandler = () => Promise<void>;

/**
 * Função que valida antes do salvamento
 * Agora retorna ValidationResultExtended para suportar erros por campo
 */
export type ValidationHandler = () => ValidationResultExtended | boolean;

/**
 * Opções ao registrar um handler
 */
export interface RegisterSaveHandlerOptions {
  /** Função de validação (opcional) */
  validate?: ValidationHandler;
  /** Ordem de execução (default: 50) */
  order?: number;
  /** Identificador da aba para navegação automática */
  tabKey?: string;
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

// ============================================================================
// SAVE ALL RESULT (Estendido)
// ============================================================================

/**
 * Resultado do saveAll/executeAll
 */
export interface SaveAllResult {
  /** Se todas as operações foram bem-sucedidas */
  success: boolean;
  /** Key do handler que falhou (para debug) */
  failedKey?: string;
  /** Erro genérico (se aplicável) */
  error?: Error;
  /** TabKey da primeira aba que falhou (para navegação) */
  firstFailedTabKey?: string;
  /** Mapa completo de erros por aba */
  tabErrors?: TabValidationMap;
}

// ============================================================================
// REGISTRY ENTRY (Estendido)
// ============================================================================

/**
 * Entrada no registry com suporte a tabKey
 */
export interface SaveRegistryEntry {
  /** Nome identificador (para logs/debug) */
  key: string;
  /** Função de salvamento */
  save: SaveHandler;
  /** Função de validação (opcional) */
  validate?: ValidationHandler;
  /** Ordem de execução (menor = primeiro) */
  order: number;
  /** Identificador da aba para navegação */
  tabKey?: string;
}
