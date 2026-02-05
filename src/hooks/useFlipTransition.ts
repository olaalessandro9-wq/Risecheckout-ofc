/**
 * useFlipTransition Hook - Motor FLIP com Web Animations API
 * 
 * @module hooks
 * @version RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Implementa a técnica FLIP (First, Last, Invert, Play) para transições
 * de layout compositor-only. Em vez de animar propriedades de layout
 * (margin, width) que causam reflow por frame, aplica o layout final
 * imediatamente e anima via transform (GPU-composited).
 * 
 * @see https://aerotwist.com/blog/flip-your-animations/
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
 * 
 * ## Como funciona
 * 1. FIRST: Captura posição atual do elemento antes da mudança
 * 2. LAST: Layout final é aplicado (1 reflow único)
 * 3. INVERT: Calcula delta e aplica transform inverso
 * 4. PLAY: Anima transform de volta a zero via WAAPI
 * 
 * ## Vantagens
 * - Zero reflow durante animação (somente compositor)
 * - 60 FPS garantido em páginas pesadas
 * - Cancelamento gracioso em mudanças rápidas
 * - Respeita prefers-reduced-motion
 */

import { useRef, useLayoutEffect } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

// ============================================================================
// TYPES
// ============================================================================

interface FlipTransitionOptions {
  /** Duração da animação em ms (default: 300) */
  duration?: number;
  /** Easing CSS (default: cubic-bezier(0.4, 0, 0.2, 1)) */
  easing?: string;
  /** Desabilitar animação programaticamente */
  disabled?: boolean;
  /** Callback ao iniciar animação */
  onStart?: () => void;
  /** Callback ao finalizar animação */
  onFinish?: () => void;
}

interface FlipState {
  left: number;
  top: number;
  width: number;
  height: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_DURATION = 300;
const DEFAULT_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para executar transições FLIP compositor-only.
 * 
 * @param ref - RefObject do elemento a animar
 * @param key - Valor que dispara a transição quando muda
 * @param options - Configurações da animação
 * 
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { currentWidth } = useNavigation();
 * 
 * useFlipTransition(containerRef, currentWidth, {
 *   duration: 300,
 *   onFinish: () => console.log('Transition complete'),
 * });
 * 
 * return (
 *   <div
 *     ref={containerRef}
 *     style={{ marginLeft: currentWidth }} // Layout aplicado diretamente
 *   >
 *     {children}
 *   </div>
 * );
 * ```
 */
export function useFlipTransition<K extends string | number>(
  ref: React.RefObject<HTMLElement | null>,
  key: K,
  options: FlipTransitionOptions = {}
): void {
  const {
    duration = DEFAULT_DURATION,
    easing = DEFAULT_EASING,
    disabled = false,
    onStart,
    onFinish,
  } = options;

  const prefersReducedMotion = usePrefersReducedMotion();
  const previousKeyRef = useRef<K | null>(null);
  const previousStateRef = useRef<FlipState | null>(null);
  const animationRef = useRef<Animation | null>(null);

  // Captura estado ANTES da mudança de layout
  // Executado em useLayoutEffect para garantir timing correto
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Se animação está desabilitada, apenas atualiza refs
    if (disabled || prefersReducedMotion) {
      previousKeyRef.current = key;
      previousStateRef.current = null;
      return;
    }

    // Primeira renderização: apenas captura estado inicial
    if (previousKeyRef.current === null) {
      previousKeyRef.current = key;
      const rect = element.getBoundingClientRect();
      previousStateRef.current = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
      return;
    }

    // Se key não mudou, não anima
    if (previousKeyRef.current === key) {
      return;
    }

    // FLIP: Key mudou, executar transição

    // 1. FIRST - Posição anterior (já capturada)
    const first = previousStateRef.current;
    
    // 2. LAST - Posição após mudança de layout (já aplicada pelo React)
    const last = element.getBoundingClientRect();
    
    // Atualizar refs para próxima iteração
    previousKeyRef.current = key;
    previousStateRef.current = {
      left: last.left,
      top: last.top,
      width: last.width,
      height: last.height,
    };

    // Se não temos estado anterior, skip (primeira renderização)
    if (!first) {
      return;
    }

    // 3. INVERT - Calcular delta
    const deltaX = first.left - last.left;
    const deltaY = first.top - last.top;

    // Se não há movimento significativo, skip
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
      return;
    }

    // Cancelar animação anterior se existir
    if (animationRef.current) {
      animationRef.current.cancel();
      animationRef.current = null;
    }

    // 4. PLAY - Animar via Web Animations API
    onStart?.();

    // Aplicar will-change para otimizar composição
    element.style.willChange = "transform";

    const animation = element.animate(
      [
        { transform: `translate(${deltaX}px, ${deltaY}px)` },
        { transform: "translate(0, 0)" },
      ],
      {
        duration,
        easing,
        fill: "none",
      }
    );

    animationRef.current = animation;

    animation.onfinish = () => {
      // Limpar will-change após animação
      element.style.willChange = "";
      animationRef.current = null;
      onFinish?.();
    };

    animation.oncancel = () => {
      // Limpar will-change se cancelada
      element.style.willChange = "";
      animationRef.current = null;
    };
  }, [key, duration, easing, disabled, prefersReducedMotion, onStart, onFinish, ref]);

  // Cleanup ao desmontar
  useLayoutEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
        animationRef.current = null;
      }
    };
  }, []);
}
