/**
 * Hooks para detecção e otimização de monitores ultrawide
 * 
 * @module hooks
 * @version RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @deprecated Prefira usar `useUltrawidePerformance()` do
 * `UltrawidePerformanceContext` para SSOT e evitar múltiplas
 * instâncias de matchMedia listeners.
 * 
 * Este hook é mantido para retrocompatibilidade de componentes
 * fora do escopo do Context (ex: bibliotecas externas).
 * 
 * @see src/contexts/UltrawidePerformanceContext.tsx
 */
import { useState, useEffect, useMemo } from "react";

const ULTRAWIDE_BREAKPOINT = 2560;

/**
 * Hook base para detectar monitores ultrawide
 * 
 * @deprecated Use `useUltrawidePerformance().isUltrawide` do Context
 */
export function useIsUltrawide(): boolean {
  const [isUltrawide, setIsUltrawide] = useState(
    typeof window !== "undefined" 
      ? window.innerWidth >= ULTRAWIDE_BREAKPOINT 
      : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${ULTRAWIDE_BREAKPOINT}px)`);
    
    const handler = (e: MediaQueryListEvent) => {
      setIsUltrawide(e.matches);
    };

    setIsUltrawide(mediaQuery.matches);
    
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return isUltrawide;
}

/**
 * Configuração de performance para componentes em ultrawide
 */
export interface UltrawidePerformanceConfig {
  readonly isUltrawide: boolean;
  readonly disableAnimations: boolean;
  readonly disableBlur: boolean;
  readonly disableHoverEffects: boolean;
  readonly simplifyTransitions: boolean;
}

/**
 * Hook que retorna configurações de performance para ultrawide
 * Componentes podem usar essas flags para desabilitar efeitos pesados
 * 
 * @deprecated Use `useUltrawidePerformance()` do Context
 */
export function useUltrawidePerformance(): UltrawidePerformanceConfig {
  const isUltrawide = useIsUltrawide();
  
  return useMemo(() => ({
    isUltrawide,
    disableAnimations: isUltrawide,
    disableBlur: isUltrawide,
    disableHoverEffects: isUltrawide,
    simplifyTransitions: isUltrawide,
  }), [isUltrawide]);
}
