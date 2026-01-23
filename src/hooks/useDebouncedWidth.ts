/**
 * Hook para debounce de largura durante animações
 * 
 * Evita que ResponsiveContainer recalcule o gráfico
 * a cada frame durante transições de layout.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Performance Optimization
 */
import { useState, useEffect, useRef } from "react";

export function useDebouncedWidth(
  targetWidth: number,
  delay: number = 350 // Maior que a animação do sidebar (300ms)
): number {
  const [debouncedWidth, setDebouncedWidth] = useState(targetWidth);
  const timeoutRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Na primeira renderização, aplicar imediatamente
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDebouncedWidth(targetWidth);
      return;
    }

    // Limpar timeout anterior
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    // Aguardar fim da animação antes de atualizar
    timeoutRef.current = window.setTimeout(() => {
      setDebouncedWidth(targetWidth);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [targetWidth, delay]);

  return debouncedWidth;
}
