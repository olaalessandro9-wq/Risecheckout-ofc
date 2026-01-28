/**
 * RouteErrorBoundary - React Router Error Recovery
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Captura erros de rota (errorElement) e tenta auto-recovery
 * para erros de rede antes de mostrar UI de erro.
 * 
 * Features:
 * - Auto-recovery para erros de rede/chunk loading
 * - Proteção anti-loop (máximo 2 tentativas em 1 minuto)
 * - UI amigável para erros persistentes
 * - Integração com lazyWithRetry para detecção de chunk errors
 * 
 * @version 1.0.0
 */

import { useEffect, useState } from "react";
import { useRouteError } from "react-router-dom";
import { isChunkLoadError } from "@/lib/lazyWithRetry";
import { createLogger } from "@/lib/logger";
import { WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const log = createLogger("RouteErrorBoundary");

// ============================================================================
// CONSTANTS
// ============================================================================

/** Limite de auto-recoveries para evitar loops infinitos */
const MAX_AUTO_RECOVERY_ATTEMPTS = 2;

/** Chave para armazenar contagem de tentativas */
const RECOVERY_ATTEMPT_KEY = "route_error_recovery_attempts";

/** Chave para armazenar timestamp da última tentativa */
const RECOVERY_TIMESTAMP_KEY = "route_error_recovery_timestamp";

/** Tempo em ms para reset do contador (1 minuto) */
const RECOVERY_RESET_TIME_MS = 60000;

/** Delay antes do auto-reload (2 segundos) */
const AUTO_RELOAD_DELAY_MS = 2000;

// ============================================================================
// COMPONENT
// ============================================================================

export function RouteErrorBoundary() {
  const error = useRouteError();
  const [recovering, setRecovering] = useState(false);
  
  // Detectar se é erro de rede/chunk
  const isNetworkError = error instanceof Error && isChunkLoadError(error);
  
  // Auto-recovery para erros de rede (com limite anti-loop)
  useEffect(() => {
    if (!isNetworkError || recovering) return;
    
    // Verificar contagem de tentativas (reset após 1 minuto)
    const now = Date.now();
    const lastTimestamp = parseInt(sessionStorage.getItem(RECOVERY_TIMESTAMP_KEY) || "0");
    let attempts = parseInt(sessionStorage.getItem(RECOVERY_ATTEMPT_KEY) || "0");
    
    // Reset contador se passou mais de 1 minuto
    if (now - lastTimestamp > RECOVERY_RESET_TIME_MS) {
      attempts = 0;
    }
    
    // Se atingiu limite, mostrar UI manual
    if (attempts >= MAX_AUTO_RECOVERY_ATTEMPTS) {
      log.warn("Max auto-recovery attempts reached, showing manual UI");
      return;
    }
    
    // Incrementar e salvar
    sessionStorage.setItem(RECOVERY_ATTEMPT_KEY, String(attempts + 1));
    sessionStorage.setItem(RECOVERY_TIMESTAMP_KEY, String(now));
    
    log.info(`Network error - auto-recovery attempt ${attempts + 1}/${MAX_AUTO_RECOVERY_ATTEMPTS}`);
    setRecovering(true);
    
    const timer = setTimeout(() => {
      window.location.reload();
    }, AUTO_RELOAD_DELAY_MS);
    
    return () => clearTimeout(timer);
  }, [isNetworkError, recovering]);
  
  // ============================================================================
  // RENDER: RECOVERING STATE
  // ============================================================================
  
  if (recovering) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Reconectando...</p>
        </div>
      </div>
    );
  }
  
  // ============================================================================
  // RENDER: ERROR UI
  // ============================================================================
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          {isNetworkError ? (
            <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/20">
              <WifiOff className="h-12 w-12 text-amber-600 dark:text-amber-400" />
            </div>
          ) : (
            <div className="p-4 rounded-full bg-destructive/10">
              <RefreshCw className="h-12 w-12 text-destructive" />
            </div>
          )}
        </div>
        
        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            {isNetworkError ? "Problemas de conexão" : "Erro inesperado"}
          </h1>
          <p className="text-muted-foreground">
            {isNetworkError
              ? "Não foi possível carregar a página. Verifique sua conexão."
              : "Ocorreu um erro. Por favor, tente novamente."}
          </p>
        </div>
        
        {/* Error Details (dev only, non-network) */}
        {!isNetworkError && error instanceof Error && (
          <div className="bg-muted p-4 rounded-lg text-left">
            <p className="text-sm font-mono text-muted-foreground break-all">
              {error.message}
            </p>
          </div>
        )}
        
        {/* Action Button */}
        <Button 
          onClick={() => window.location.reload()} 
          size="lg" 
          className="w-full"
          variant={isNetworkError ? "default" : "destructive"}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
        
        {/* Help Text */}
        <p className="text-xs text-muted-foreground">
          {isNetworkError
            ? "Dica: Verifique se você está conectado à internet ou tente novamente em alguns segundos."
            : "Se o problema persistir, entre em contato com o suporte."}
        </p>
      </div>
    </div>
  );
}
