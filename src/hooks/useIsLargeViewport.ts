/**
 * useIsLargeViewport Hook
 * 
 * @module hooks
 * @version RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Detecta viewports grandes (>= 1920px) para ativar otimizações
 * de performance compositor-only no AppShell.
 * 
 * Em monitores normais (< 1920px), a sidebar usa CSS transition
 * padrão que funciona perfeitamente. Em monitores grandes, o
 * AppShell alterna para FLIP compositor-only para evitar reflow
 * na área de conteúdo (que é muito maior e contém SVGs/tabelas).
 * 
 * @see src/layouts/AppShell.tsx
 * @see src/hooks/useFlipTransition.ts
 */

import { useState, useEffect } from "react";

const LARGE_VIEWPORT_BREAKPOINT = 1920;
const QUERY = `(min-width: ${LARGE_VIEWPORT_BREAKPOINT}px)`;

/**
 * Hook que retorna true se o viewport é >= 1920px.
 * 
 * Reativo a mudanças de tamanho (ex: resize, mudança de monitor).
 * Segue o mesmo padrão do usePrefersReducedMotion.
 * 
 * @returns boolean - true se viewport >= 1920px
 */
export function useIsLargeViewport(): boolean {
  const [isLarge, setIsLarge] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsLarge(event.matches);
    };

    // Sync inicial
    setIsLarge(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isLarge;
}
