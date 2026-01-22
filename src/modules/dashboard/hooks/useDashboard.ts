/**
 * Hook principal do Dashboard
 * 
 * @module dashboard/hooks
 * @version RISE V3 Compliant
 * 
 * Orquestra o estado do DateRange + Query de dados.
 * Single Source of Truth para todo o Dashboard.
 */

import { useDateRangeState } from "./useDateRangeState";
import { useDashboardAnalytics } from "./useDashboardAnalytics";

/**
 * Hook principal que combina estado + dados do Dashboard
 * 
 * Retorna tudo necessário para renderizar o Dashboard:
 * - state: Estado do DateRange (preset, datas, UI states)
 * - actions: Funções para mutar o estado
 * - dateRange: Intervalo de datas calculado
 * - data: Dados do dashboard (métricas, gráfico, clientes)
 * - isLoading: Estado de carregamento
 * - refetch: Função para recarregar dados
 */
export function useDashboard() {
  const { state, actions, dateRange } = useDateRangeState();
  const { data, isLoading, refetch } = useDashboardAnalytics(dateRange, state.preset);

  return {
    // DateRange State
    state,
    actions,
    dateRange,
    
    // Data Query
    data,
    isLoading,
    refetch,
  };
}
