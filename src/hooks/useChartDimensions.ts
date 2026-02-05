/**
 * Hook para dimensionamento de gráficos com debounce inteligente
 * 
 * Elimina o travamento causado pelo ResponsiveContainer do Recharts
 * durante transições de layout (sidebar, resize, etc).
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Performance Optimization
 * @see .lovable/plan.md - Solução C (Nota 10.0/10)
 */

import { useState, useEffect, useRef, type RefObject } from "react";

interface ChartDimensions {
  width: number;
  height: number;
}

/**
 * Hook otimizado para dimensionamento de gráficos.
 * 
 * Diferente do ResponsiveContainer que recalcula a cada frame durante
 * uma transição CSS, este hook aguarda o fim da transição antes de
 * atualizar as dimensões.
 * 
 * @param ref - Referência ao container do gráfico
 * @param transitionDelay - Tempo em ms para aguardar após resize (default: 350ms)
 * @returns Dimensões { width, height } do container
 * 
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { width, height } = useChartDimensions(containerRef);
 * 
 * return (
 *   <div ref={containerRef}>
 *     {width > 0 && height > 0 && (
 *       <AreaChart width={width} height={height} ... />
 *     )}
 *   </div>
 * );
 * ```
 */
export function useChartDimensions(
  ref: RefObject<HTMLElement | null>,
  transitionDelay: number = 50
): ChartDimensions {
  const [dimensions, setDimensions] = useState<ChartDimensions>({ 
    width: 0, 
    height: 0 
  });
  const transitionTimeoutRef = useRef<number | null>(null);
  const isFirstMeasurement = useRef(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateDimensions = (immediate: boolean = false) => {
      const { width, height } = element.getBoundingClientRect();
      const newDimensions = {
        width: Math.floor(width),
        height: Math.floor(height),
      };

      // Só atualizar se as dimensões realmente mudaram
      setDimensions((prev) => {
        if (prev.width === newDimensions.width && prev.height === newDimensions.height) {
          return prev;
        }
        return newDimensions;
      });
    };

    const observer = new ResizeObserver(() => {
      // Na primeira medição, aplicar imediatamente
      if (isFirstMeasurement.current) {
        isFirstMeasurement.current = false;
        updateDimensions(true);
        return;
      }

      // Limpar timeout anterior (debounce)
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }

      // Aguardar fim da transição antes de atualizar
      transitionTimeoutRef.current = window.setTimeout(() => {
        updateDimensions();
      }, transitionDelay);
    });

    // Medição inicial imediata
    updateDimensions(true);

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [ref, transitionDelay]);

  return dimensions;
}
