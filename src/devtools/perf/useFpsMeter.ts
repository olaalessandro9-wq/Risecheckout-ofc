/**
 * useFpsMeter Hook - Medidor de FPS em tempo real
 * 
 * @module devtools/perf
 * @version RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Hook DEV-only para monitorar FPS durante transições.
 * Usa requestAnimationFrame para medir tempo entre frames.
 * 
 * @warning Este hook é para desenvolvimento apenas. Não incluir em produção.
 */

import { useState, useEffect, useRef, useCallback } from "react";

interface FpsMeterState {
  /** FPS atual (média móvel) */
  fps: number;
  /** FPS mínimo registrado na janela atual */
  minFps: number;
  /** FPS máximo registrado na janela atual */
  maxFps: number;
  /** Se está em estado de "jank" (FPS < 50) */
  isJanking: boolean;
}

interface UseFpsMeterOptions {
  /** Se o meter está ativo (default: true) */
  enabled?: boolean;
  /** Tamanho da janela de samples para média móvel (default: 60) */
  sampleSize?: number;
  /** Limiar de FPS para considerar "jank" (default: 50) */
  jankThreshold?: number;
}

/**
 * Hook para medir FPS em tempo real.
 * 
 * @param options - Configurações do meter
 * @returns Estado do FPS meter
 * 
 * @example
 * ```tsx
 * const { fps, isJanking } = useFpsMeter({ enabled: isDev });
 * 
 * return (
 *   <div className={isJanking ? 'text-red-500' : 'text-green-500'}>
 *     {fps} FPS
 *   </div>
 * );
 * ```
 */
export function useFpsMeter(options: UseFpsMeterOptions = {}): FpsMeterState {
  const {
    enabled = true,
    sampleSize = 60,
    jankThreshold = 50,
  } = options;

  const [state, setState] = useState<FpsMeterState>({
    fps: 60,
    minFps: 60,
    maxFps: 60,
    isJanking: false,
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number>(0);
  const minFpsRef = useRef<number>(60);
  const maxFpsRef = useRef<number>(60);

  const measureFrame = useCallback((timestamp: number) => {
    if (lastFrameTimeRef.current > 0) {
      const delta = timestamp - lastFrameTimeRef.current;
      const currentFps = delta > 0 ? Math.round(1000 / delta) : 60;
      
      // Adicionar ao buffer circular
      frameTimesRef.current.push(currentFps);
      if (frameTimesRef.current.length > sampleSize) {
        frameTimesRef.current.shift();
      }

      // Calcular média móvel
      const avgFps = Math.round(
        frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
      );

      // Track min/max
      if (currentFps < minFpsRef.current) minFpsRef.current = currentFps;
      if (currentFps > maxFpsRef.current) maxFpsRef.current = currentFps;

      // Atualizar estado (throttled para evitar re-renders excessivos)
      if (frameTimesRef.current.length % 10 === 0) {
        setState({
          fps: avgFps,
          minFps: minFpsRef.current,
          maxFps: maxFpsRef.current,
          isJanking: avgFps < jankThreshold,
        });
      }
    }

    lastFrameTimeRef.current = timestamp;
    rafIdRef.current = requestAnimationFrame(measureFrame);
  }, [sampleSize, jankThreshold]);

  useEffect(() => {
    if (!enabled) return;

    rafIdRef.current = requestAnimationFrame(measureFrame);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [enabled, measureFrame]);

  // Reset min/max periodicamente (a cada 5 segundos)
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      minFpsRef.current = 60;
      maxFpsRef.current = 60;
    }, 5000);

    return () => clearInterval(interval);
  }, [enabled]);

  return state;
}
