/**
 * useLongTaskObserver Hook - Detector de Long Tasks
 * 
 * @module devtools/perf
 * @version RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Hook DEV-only para monitorar Long Tasks (>50ms) que causam jank.
 * Usa PerformanceObserver para detectar tarefas longas automaticamente.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongTaskTiming
 * 
 * @warning Este hook é para desenvolvimento apenas. Não incluir em produção.
 */

import { useState, useEffect, useRef, useCallback } from "react";

interface LongTask {
  /** ID único da task */
  id: string;
  /** Duração em ms */
  duration: number;
  /** Timestamp de início */
  startTime: number;
  /** Nome do container (se disponível) */
  containerName: string;
}

interface LongTaskState {
  /** Long tasks recentes (últimas 10) */
  tasks: LongTask[];
  /** Total de long tasks desde o início */
  totalCount: number;
  /** Duração máxima registrada */
  maxDuration: number;
  /** Se houve long task nos últimos 500ms */
  recentlyJanked: boolean;
}

interface UseLongTaskObserverOptions {
  /** Se o observer está ativo (default: true) */
  enabled?: boolean;
  /** Limiar de duração para considerar "long task" (default: 50) */
  threshold?: number;
  /** Número máximo de tasks a manter no histórico (default: 10) */
  maxHistory?: number;
}

/**
 * Hook para monitorar Long Tasks.
 * 
 * @param options - Configurações do observer
 * @returns Estado das long tasks
 * 
 * @example
 * ```tsx
 * const { totalCount, recentlyJanked, maxDuration } = useLongTaskObserver({ enabled: isDev });
 * 
 * return (
 *   <div className={recentlyJanked ? 'bg-red-500' : 'bg-green-500'}>
 *     Long Tasks: {totalCount} | Max: {maxDuration}ms
 *   </div>
 * );
 * ```
 */
export function useLongTaskObserver(options: UseLongTaskObserverOptions = {}): LongTaskState {
  const {
    enabled = true,
    threshold = 50,
    maxHistory = 10,
  } = options;

  const [state, setState] = useState<LongTaskState>({
    tasks: [],
    totalCount: 0,
    maxDuration: 0,
    recentlyJanked: false,
  });

  const taskIdRef = useRef(0);
  const recentlyJankedTimeoutRef = useRef<number | null>(null);

  const handleLongTask = useCallback((entries: PerformanceObserverEntryList) => {
    const longTasks = entries.getEntries() as PerformanceLongTaskTiming[];

    longTasks.forEach((entry) => {
      if (entry.duration < threshold) return;

      const newTask: LongTask = {
        id: `lt-${++taskIdRef.current}`,
        duration: Math.round(entry.duration),
        startTime: Math.round(entry.startTime),
        containerName: entry.attribution?.[0]?.containerName || "unknown",
      };

      setState((prev) => {
        const newTasks = [newTask, ...prev.tasks].slice(0, maxHistory);
        
        return {
          tasks: newTasks,
          totalCount: prev.totalCount + 1,
          maxDuration: Math.max(prev.maxDuration, newTask.duration),
          recentlyJanked: true,
        };
      });

      // Limpar flag "recentlyJanked" após 500ms
      if (recentlyJankedTimeoutRef.current) {
        clearTimeout(recentlyJankedTimeoutRef.current);
      }
      recentlyJankedTimeoutRef.current = window.setTimeout(() => {
        setState((prev) => ({ ...prev, recentlyJanked: false }));
      }, 500);
    });
  }, [threshold, maxHistory]);

  useEffect(() => {
    if (!enabled) return;

    // Verificar suporte
    if (typeof PerformanceObserver === "undefined") {
      console.warn("[LongTaskObserver] PerformanceObserver not supported");
      return;
    }

    // Verificar se "longtask" é suportado
    const supportedTypes = PerformanceObserver.supportedEntryTypes || [];
    if (!supportedTypes.includes("longtask")) {
      console.warn("[LongTaskObserver] longtask entry type not supported");
      return;
    }

    try {
      const observer = new PerformanceObserver(handleLongTask);
      observer.observe({ type: "longtask", buffered: true });

      return () => {
        observer.disconnect();
        if (recentlyJankedTimeoutRef.current) {
          clearTimeout(recentlyJankedTimeoutRef.current);
        }
      };
    } catch (e) {
      console.warn("[LongTaskObserver] Failed to create observer:", e);
    }
  }, [enabled, handleLongTask]);

  return state;
}

// Type augmentation for PerformanceLongTaskTiming
interface PerformanceLongTaskTiming extends PerformanceEntry {
  attribution?: Array<{
    containerName?: string;
    containerId?: string;
    containerType?: string;
    containerSrc?: string;
  }>;
}
