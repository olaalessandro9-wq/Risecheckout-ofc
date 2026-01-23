/**
 * Hooks para detecção e otimização de monitores ultrawide
 * 
 * Detecta se o usuário está em monitor ultrawide (≥2560px)
 * e fornece flags de performance para componentes.
 * 
 * @module hooks
 * @version RISE V3 Compliant
 */
import { useState, useEffect, useMemo } from "react";

const ULTRAWIDE_BREAKPOINT = 2560;

/**
 * Hook base para detectar monitores ultrawide
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
