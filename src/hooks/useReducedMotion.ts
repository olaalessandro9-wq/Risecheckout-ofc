/**
 * useReducedMotion Hook
 * 
 * @module hooks
 * @version RISE V3 Compliant
 * 
 * Detecta quando animações devem ser reduzidas para melhorar performance.
 * Considera preferência do sistema, dispositivo mobile, e Safari iOS.
 */

import { useState, useEffect, useMemo } from 'react';

interface ReducedMotionState {
  /** Se animações devem ser desabilitadas ou simplificadas */
  shouldReduceMotion: boolean;
  /** Se é dispositivo mobile */
  isMobile: boolean;
  /** Se é Safari iOS (conhecido por problemas de performance) */
  isSafariIOS: boolean;
  /** Se usuário prefere movimento reduzido no sistema */
  prefersReducedMotion: boolean;
}

/**
 * Hook que detecta quando animações devem ser reduzidas
 * 
 * @returns Estado com flags de redução de movimento
 */
export function useReducedMotion(): ReducedMotionState {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Detectar mobile e Safari iOS (cálculo estático, não muda durante sessão)
  const { isMobile, isSafariIOS } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { isMobile: false, isSafariIOS: false };
    }

    const mobile = window.matchMedia('(max-width: 768px)').matches;
    
    // Detectar Safari iOS especificamente
    const ua = navigator.userAgent;
    const safariIOS = /iPhone|iPad|iPod/.test(ua) && 
                      /Safari/.test(ua) && 
                      !/Chrome|CriOS|FxiOS/.test(ua);

    return { isMobile: mobile, isSafariIOS: safariIOS };
  }, []);

  // Escutar mudanças na preferência do sistema
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Decisão final: reduzir motion se qualquer condição for verdadeira
  const shouldReduceMotion = prefersReducedMotion || isMobile || isSafariIOS;

  return {
    shouldReduceMotion,
    isMobile,
    isSafariIOS,
    prefersReducedMotion,
  };
}

/**
 * Hook simplificado que retorna apenas boolean
 * Para casos onde só precisa saber se deve reduzir
 */
export function useShouldReduceMotion(): boolean {
  const { shouldReduceMotion } = useReducedMotion();
  return shouldReduceMotion;
}
