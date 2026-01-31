/**
 * Dashboard Type-Safe Mock Factories
 * 
 * @module test/factories/dashboard
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Factories centralizadas para mocks type-safe do módulo Dashboard.
 * Segue SSOT dos tipos em src/modules/dashboard/types/dashboard.types.ts
 * e src/modules/dashboard/hooks/useDateRangeState.ts
 */

import { vi } from "vitest";
import type { DateRangeState, DateRangeActions } from "@/modules/dashboard/hooks/useDateRangeState";
import type { 
  DateRangePreset,
  TrendData, 
  DashboardMetrics 
} from "@/modules/dashboard/types/dashboard.types";

// ============================================================================
// DATE RANGE FACTORIES
// ============================================================================

/**
 * Cria um mock type-safe de DateRangeState
 * 
 * @param overrides - Propriedades para sobrescrever os valores padrão
 * @returns DateRangeState completo e tipado
 */
export function createMockDateRangeState(
  overrides: Partial<DateRangeState> = {}
): DateRangeState {
  return {
    preset: "7days",
    dropdownOpen: false,
    calendarOpen: false,
    leftDate: undefined,
    rightDate: undefined,
    leftMonth: new Date(),
    rightMonth: new Date(),
    savedRange: undefined,
    hasError: false,
    ...overrides,
  };
}

/**
 * Cria um mock type-safe de DateRangeActions
 * 
 * @param overrides - Funções mock customizadas
 * @returns DateRangeActions completo e tipado
 */
export function createMockDateRangeActions(
  overrides: Partial<DateRangeActions> = {}
): DateRangeActions {
  return {
    setPreset: vi.fn() as unknown as (preset: DateRangePreset) => void,
    openDropdown: vi.fn() as unknown as () => void,
    closeDropdown: vi.fn() as unknown as () => void,
    openCalendar: vi.fn() as unknown as () => void,
    closeCalendar: vi.fn() as unknown as () => void,
    setLeftDate: vi.fn() as unknown as (date: Date) => void,
    setRightDate: vi.fn() as unknown as (date: Date) => void,
    setLeftMonth: vi.fn() as unknown as (date: Date) => void,
    setRightMonth: vi.fn() as unknown as (date: Date) => void,
    applyCustomRange: vi.fn() as unknown as () => void,
    cancel: vi.fn() as unknown as () => void,
    restoreSaved: vi.fn() as unknown as () => void,
    ...overrides,
  };
}

// ============================================================================
// TREND DATA FACTORY
// ============================================================================

/**
 * Cria um mock type-safe de TrendData
 * 
 * IMPORTANTE: O tipo SSOT usa 'label', NÃO 'percentage'
 * 
 * @param overrides - Propriedades para sobrescrever os valores padrão
 * @returns TrendData completo e tipado
 */
export function createMockTrendData(
  overrides: Partial<TrendData> = {}
): TrendData {
  return {
    value: 0,
    isPositive: true,
    label: "0%",
    ...overrides,
  };
}

// ============================================================================
// DASHBOARD METRICS FACTORY
// ============================================================================

/**
 * Cria um mock type-safe de DashboardMetrics
 * 
 * IMPORTANTE: Inclui TODOS os campos obrigatórios do tipo SSOT:
 * - totalFees, checkoutsStarted, totalPaidOrders, totalPendingOrders
 * - averageTicket, pixRevenue, creditCardRevenue
 * 
 * @param overrides - Propriedades para sobrescrever os valores padrão
 * @returns DashboardMetrics completo e tipado
 */
export function createMockDashboardMetrics(
  overrides: Partial<DashboardMetrics> = {}
): DashboardMetrics {
  return {
    // Métricas financeiras
    totalRevenue: "R$ 0,00",
    paidRevenue: "R$ 0,00",
    pendingRevenue: "R$ 0,00",
    totalFees: "R$ 0,00",
    
    // Métricas de conversão
    checkoutsStarted: 0,
    totalPaidOrders: 0,
    totalPendingOrders: 0,
    conversionRate: "0%",
    
    // Métricas adicionais
    averageTicket: "R$ 0,00",
    pixRevenue: "R$ 0,00",
    creditCardRevenue: "R$ 0,00",
    
    ...overrides,
  };
}

// ============================================================================
// PRESET HELPERS
// ============================================================================

/**
 * Lista de presets válidos conforme SSOT
 */
export const VALID_PRESETS: readonly DateRangePreset[] = [
  "today",
  "yesterday",
  "7days",
  "30days",
  "max",
  "custom",
] as const;

/**
 * Verifica se um preset é válido
 */
export function isValidPreset(preset: string): preset is DateRangePreset {
  return VALID_PRESETS.includes(preset as DateRangePreset);
}
