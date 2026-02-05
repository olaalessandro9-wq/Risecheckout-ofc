/**
 * PerfOverlay - Performance Monitor Overlay (DEV ONLY)
 * 
 * @module devtools/perf
 * @version RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Overlay DEV-only para monitorar performance em tempo real.
 * Mostra FPS, Long Tasks, e status de transições.
 * 
 * Ativado apenas em desenvolvimento via import.meta.env.DEV.
 * 
 * @warning Este componente NÃO deve ser incluído em builds de produção.
 */

import { useState, useCallback, memo } from "react";
import { useFpsMeter } from "./useFpsMeter";
import { useLongTaskObserver } from "./useLongTaskObserver";

// ============================================================================
// CONSTANTS
// ============================================================================

const IS_DEV = import.meta.env.DEV;

// ============================================================================
// COMPONENT
// ============================================================================

interface PerfOverlayProps {
  /** Forçar exibição mesmo em produção (usar com cautela) */
  forceShow?: boolean;
}

/**
 * Overlay de performance para desenvolvimento.
 * 
 * Mostra:
 * - FPS atual (verde/amarelo/vermelho)
 * - Contagem de Long Tasks
 * - Indicador de jank recente
 * 
 * @example
 * ```tsx
 * // No App.tsx ou layout principal
 * <PerfOverlay />
 * ```
 */
export const PerfOverlay = memo(function PerfOverlay({ forceShow = false }: PerfOverlayProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const shouldShow = IS_DEV || forceShow;

  const { fps, minFps, isJanking } = useFpsMeter({ enabled: shouldShow });
  const { totalCount, maxDuration, recentlyJanked } = useLongTaskObserver({ enabled: shouldShow });

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  // Não renderizar em produção
  if (!shouldShow) return null;

  // Cor do FPS baseada no valor
  const getFpsColor = () => {
    if (fps >= 55) return "#22c55e"; // green
    if (fps >= 45) return "#eab308"; // yellow
    return "#ef4444"; // red
  };

  // Versão minimizada
  if (isMinimized) {
    return (
      <button
        onClick={toggleMinimize}
        className="fixed bottom-4 right-4 z-[9999] px-3 py-1.5 rounded-full text-xs font-mono font-bold shadow-lg transition-colors"
        style={{
          backgroundColor: isJanking || recentlyJanked ? "#ef4444" : "#1e293b",
          color: "#fff",
        }}
        title="Expand Performance Monitor"
      >
        {fps} FPS
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] bg-slate-900/95 text-white rounded-lg shadow-2xl font-mono text-xs p-3 min-w-[180px]"
      style={{ backdropFilter: "blur(4px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700">
        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
          Perf Monitor
        </span>
        <button
          onClick={toggleMinimize}
          className="text-slate-500 hover:text-white transition-colors px-1"
          title="Minimize"
        >
          ─
        </button>
      </div>

      {/* FPS */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-slate-400">FPS</span>
        <span
          className="font-bold tabular-nums"
          style={{ color: getFpsColor() }}
        >
          {fps}
        </span>
      </div>

      {/* Min FPS */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-slate-400">Min FPS</span>
        <span
          className="font-bold tabular-nums"
          style={{ color: minFps < 45 ? "#ef4444" : "#94a3b8" }}
        >
          {minFps}
        </span>
      </div>

      {/* Long Tasks */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-slate-400">Long Tasks</span>
        <span
          className="font-bold tabular-nums"
          style={{ color: totalCount > 0 ? "#f59e0b" : "#22c55e" }}
        >
          {totalCount}
        </span>
      </div>

      {/* Max Duration */}
      {maxDuration > 0 && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-400">Max Task</span>
          <span
            className="font-bold tabular-nums"
            style={{ color: maxDuration > 100 ? "#ef4444" : "#f59e0b" }}
          >
            {maxDuration}ms
          </span>
        </div>
      )}

      {/* Jank Indicator */}
      {(isJanking || recentlyJanked) && (
        <div className="mt-2 pt-2 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-semibold">JANK DETECTED</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default PerfOverlay;
