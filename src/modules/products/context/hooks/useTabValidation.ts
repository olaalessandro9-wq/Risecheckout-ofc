/**
 * useTabValidation - Gerencia Estado de Validação por Tab
 * 
 * Responsável por:
 * - Rastrear quais tabs têm erros de validação
 * - Determinar primeira tab com erro (da esquerda para direita)
 * - Controlar navegação automática para tabs com erro
 * - Sincronizar com ProductTabs para indicadores visuais
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Sistema de Validação Global
 */

import { useState, useCallback, useMemo } from "react";
import { createLogger } from "@/lib/logger";
import type { 
  TabValidationMap, 
  TabNavigationState,
} from "../../types/tabValidation.types";
import { TAB_ORDER } from "../../types/tabValidation.types";

const log = createLogger('TabValidation');

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseTabValidationReturn {
  /** Aba atualmente ativa */
  activeTab: string;
  /** Setter para aba ativa */
  setActiveTab: (tab: string) => void;
  /** Mapa de erros por aba */
  tabErrors: TabValidationMap;
  /** Setter para erros de tabs */
  setTabErrors: (errors: TabValidationMap) => void;
  /** Primeira aba com erro (null se não houver) */
  firstTabWithError: string | null;
  /** Navega para primeira aba com erro */
  navigateToFirstError: () => void;
  /** Limpa todos os erros de validação */
  clearTabErrors: () => void;
  /** Estado completo para debug */
  navigationState: TabNavigationState;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook que gerencia validação e navegação por abas
 * 
 * @param initialTab - Aba inicial (default: "geral")
 * @returns Estado e funções de controle de validação
 */
export function useTabValidation(initialTab: string = "geral"): UseTabValidationReturn {
  // Estado da aba ativa
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  
  // Estado de erros por aba
  const [tabErrors, setTabErrors] = useState<TabValidationMap>({});

  // Calcula primeira aba com erro seguindo ordem da UI (esquerda → direita)
  const firstTabWithError = useMemo<string | null>(() => {
    // Itera na ordem das tabs na UI
    for (const tabKey of TAB_ORDER) {
      if (tabErrors[tabKey]?.hasError) {
        return tabKey;
      }
    }
    return null;
  }, [tabErrors]);

  // Navega para primeira aba com erro
  const navigateToFirstError = useCallback(() => {
    if (firstTabWithError) {
      log.debug(`Navegando para primeira aba com erro: ${firstTabWithError}`);
      setActiveTab(firstTabWithError);
    }
  }, [firstTabWithError]);

  // Limpa todos os erros
  const clearTabErrors = useCallback(() => {
    log.debug('Limpando todos os erros de validação');
    setTabErrors({});
  }, []);

  // Estado completo para debug
  const navigationState = useMemo<TabNavigationState>(() => ({
    activeTab,
    tabErrors,
    firstTabWithError,
  }), [activeTab, tabErrors, firstTabWithError]);

  return {
    activeTab,
    setActiveTab,
    tabErrors,
    setTabErrors,
    firstTabWithError,
    navigateToFirstError,
    clearTabErrors,
    navigationState,
  };
}
