/**
 * useOptimizedAnimations Hook
 * 
 * @module hooks
 * @version RISE V3 Compliant
 * 
 * Hook para otimização de animações Framer Motion.
 * Reduz animações em dispositivos com preferência por movimento reduzido.
 */

import { useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

export interface OptimizedAnimationConfig {
  /** Se deve animar (false = sem animação) */
  shouldAnimate: boolean;
  /** Configuração de transição otimizada */
  transition: {
    type: 'tween';
    duration: number;
    ease: string;
  };
  /** Variantes de fade otimizadas */
  fadeIn: {
    initial: { opacity: number; y: number };
    animate: { opacity: number; y: number };
  };
  /** Variantes de scale otimizadas */
  scaleIn: {
    initial: { opacity: number; scale: number };
    animate: { opacity: number; scale: number };
  };
}

/**
 * Hook que retorna configurações otimizadas para animações
 * 
 * @returns Configurações de animação otimizadas
 */
export function useOptimizedAnimations(): OptimizedAnimationConfig {
  const prefersReducedMotion = useReducedMotion();
  
  return useMemo(() => ({
    shouldAnimate: !prefersReducedMotion,
    transition: {
      type: 'tween' as const,
      duration: 0.2,
      ease: 'easeOut',
    },
    fadeIn: {
      initial: { opacity: 0, y: prefersReducedMotion ? 0 : 10 },
      animate: { opacity: 1, y: 0 },
    },
    scaleIn: {
      initial: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.98 },
      animate: { opacity: 1, scale: 1 },
    },
  }), [prefersReducedMotion]);
}
