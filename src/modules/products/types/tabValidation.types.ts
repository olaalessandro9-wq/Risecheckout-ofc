/**
 * Tipos para Sistema de Validação por Tab
 * 
 * Define estruturas para rastrear erros de validação
 * por aba e controlar navegação automática.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Sistema de Validação Global
 */

// ============================================================================
// TAB VALIDATION STATE
// ============================================================================

/**
 * Estado de validação de uma única aba
 */
export interface TabValidationState {
  /** Se a aba tem algum erro de validação */
  hasError: boolean;
  /** Lista de campos com erro nesta aba */
  fields: string[];
  /** Mensagens de erro por campo */
  errors: Record<string, string>;
}

/**
 * Mapa de validação para todas as abas
 * Chave = tabKey, Valor = estado de validação
 */
export interface TabValidationMap {
  [tabKey: string]: TabValidationState;
}

// ============================================================================
// VALIDATION RESULT EXTENDED
// ============================================================================

/**
 * Resultado de validação estendido com informações de aba
 */
export interface ValidationResultExtended {
  /** Se a validação passou */
  isValid: boolean;
  /** Mapa de campo -> mensagem de erro */
  errors: Record<string, string>;
  /** Identificador da aba (para rastreamento) */
  tabKey?: string;
}

// ============================================================================
// SAVE ALL RESULT EXTENDED
// ============================================================================

/**
 * Resultado do saveAll estendido com informações de abas
 */
export interface SaveAllResultExtended {
  /** Se todas as operações foram bem-sucedidas */
  success: boolean;
  /** Key do handler que falhou (para debug) */
  failedKey?: string;
  /** TabKey da primeira aba que falhou (para navegação) */
  firstFailedTabKey?: string;
  /** Mapa completo de erros por aba */
  tabErrors?: TabValidationMap;
  /** Erro genérico (se aplicável) */
  error?: Error;
}

// ============================================================================
// TAB NAVIGATION STATE
// ============================================================================

/**
 * Estado de navegação controlada por validação
 */
export interface TabNavigationState {
  /** Aba atualmente ativa */
  activeTab: string;
  /** Mapa de erros por aba */
  tabErrors: TabValidationMap;
  /** Primeira aba com erro (null se não houver) */
  firstTabWithError: string | null;
}

// ============================================================================
// TAB ORDER CONFIGURATION
// ============================================================================

/**
 * Ordem das abas para navegação automática
 * Da esquerda para direita na UI
 */
export const TAB_ORDER: readonly string[] = [
  "geral",
  "configuracoes",
  "order-bump",
  "upsell",
  "checkout",
  "cupons",
  "afiliados",
  "links",
  "membros",
] as const;

/**
 * Tipo para chaves de abas válidas
 */
export type TabKey = typeof TAB_ORDER[number];
