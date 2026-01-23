/**
 * Hook para detecção de monitor ultrawide
 * 
 * Detecta se o usuário está em monitor ultrawide (≥2560px)
 * para aplicar otimizações de performance automaticamente.
 * 
 * @module hooks
 * @version RISE V3 Compliant
 */
import { useState, useEffect } from "react";

const ULTRAWIDE_BREAKPOINT = 2560;

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
