/**
 * UltrawidePerformanceContext
 * 
 * @module contexts
 * @version RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Contexto centralizado para flags de performance em monitores ultrawide (≥2560px).
 * Este é o SSOT (Single Source of Truth) para configurações de performance,
 * eliminando chamadas redundantes de useIsUltrawide em múltiplos componentes.
 * 
 * Responsabilidades:
 * - Detectar monitores ultrawide via matchMedia
 * - Prover flags de performance para componentes
 * - Centralizar configurações de gráficos Recharts
 */

import * as React from "react";
import { createLogger } from "@/lib/logger";

const log = createLogger("UltrawidePerformanceContext");

const ULTRAWIDE_BREAKPOINT = 2560;

/**
 * Configurações de performance para gráficos Recharts
 */
export interface ChartPerformanceConfig {
  readonly isAnimationActive: boolean;
  readonly animationDuration: number;
  readonly dot: false | {
    readonly r: number;
    readonly strokeWidth: number;
    readonly stroke: string;
    readonly fill: string;
  };
  readonly activeDot: {
    readonly r: number;
    readonly fill: string;
    readonly strokeWidth?: number;
    readonly stroke?: string;
  };
  readonly strokeWidth: number;
  readonly debounce: number;
}

/**
 * Interface do contexto de performance
 */
export interface UltrawidePerformanceContextValue {
  readonly isUltrawide: boolean;
  readonly disableAnimations: boolean;
  readonly disableBlur: boolean;
  readonly disableHoverEffects: boolean;
  readonly chartConfig: ChartPerformanceConfig;
}

// Cor primária RISE (azul)
const CHART_COLOR = "#004fff";

const defaultChartConfig: ChartPerformanceConfig = {
  isAnimationActive: true,
  animationDuration: 250,
  dot: false,
  activeDot: {
    r: 6,
    strokeWidth: 2,
    stroke: "#ffffff",
    fill: CHART_COLOR,
  },
  strokeWidth: 2,
  debounce: 500,
};

const ultrawideChartConfig: ChartPerformanceConfig = {
  isAnimationActive: false,
  animationDuration: 0,
  dot: false,
  activeDot: {
    r: 6,
    fill: CHART_COLOR,
  },
  strokeWidth: 2,
  debounce: 600,
};

const defaultContextValue: UltrawidePerformanceContextValue = {
  isUltrawide: false,
  disableAnimations: false,
  disableBlur: false,
  disableHoverEffects: false,
  chartConfig: defaultChartConfig,
};

const UltrawidePerformanceContext = React.createContext<UltrawidePerformanceContextValue>(
  defaultContextValue
);

UltrawidePerformanceContext.displayName = "UltrawidePerformanceContext";

interface UltrawidePerformanceProviderProps {
  readonly children: React.ReactNode;
}

/**
 * Provider que detecta monitores ultrawide e provê configurações de performance
 * otimizadas para todo o app.
 */
export function UltrawidePerformanceProvider({ children }: UltrawidePerformanceProviderProps) {
  const [isUltrawide, setIsUltrawide] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= ULTRAWIDE_BREAKPOINT;
  });

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${ULTRAWIDE_BREAKPOINT}px)`);

    const handleChange = (e: MediaQueryListEvent) => {
      log.info(`Ultrawide mode changed: ${e.matches}`);
      setIsUltrawide(e.matches);
    };

    // Sync inicial
    setIsUltrawide(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const value = React.useMemo<UltrawidePerformanceContextValue>(() => ({
    isUltrawide,
    disableAnimations: isUltrawide,
    disableBlur: isUltrawide,
    disableHoverEffects: isUltrawide,
    chartConfig: isUltrawide ? ultrawideChartConfig : defaultChartConfig,
  }), [isUltrawide]);

  return (
    <UltrawidePerformanceContext.Provider value={value}>
      {children}
    </UltrawidePerformanceContext.Provider>
  );
}

/**
 * Hook para consumir configurações de performance ultrawide.
 * Substitui chamadas diretas a useIsUltrawide() para SSOT.
 */
export function useUltrawidePerformance(): UltrawidePerformanceContextValue {
  return React.useContext(UltrawidePerformanceContext);
}

/**
 * Hook para obter apenas o chartConfig.
 * Útil para componentes de gráficos que só precisam das configurações de chart.
 */
export function useChartPerformanceConfig(): ChartPerformanceConfig {
  const { chartConfig } = React.useContext(UltrawidePerformanceContext);
  return chartConfig;
}
