/**
 * ContextAwareProtectedRoute
 * 
 * RISE Protocol V3 - 10.0/10 (Two-Level Loading Architecture)
 * 
 * Combina autenticação + verificação de contexto em um único componente.
 * Elimina race conditions entre ProtectedRoute e Context Guards.
 * 
 * RISE V3 Two-Level Loading:
 * - isAuthLoading: TRUE apenas no primeiro load (sem cache)
 * - isSyncing: TRUE durante background refetches (NÃO bloqueia UI)
 * 
 * Comportamento:
 * 1. isAuthLoading → Spinner (único, sem flash)
 * 2. !isAuthenticated → Redireciona para auth do contexto REQUERIDO
 * 3. contextoErrado → Redireciona para dashboard do contexto ATUAL
 * 4. OK → Renderiza children
 */

import { Navigate, useLocation } from "react-router-dom";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { Loader2 } from "lucide-react";

interface ContextAwareProtectedRouteProps {
  requiredContext: "producer" | "buyer";
  children: React.ReactNode;
}

export function ContextAwareProtectedRoute({ 
  requiredContext, 
  children 
}: ContextAwareProtectedRouteProps) {
  // RISE V3: Usa isAuthLoading (Two-Level) em vez de isLoading
  // isAuthLoading = true APENAS no primeiro load sem cache
  // isSyncing = true durante background refetches (NÃO bloqueia UI)
  const { isAuthenticated, isAuthLoading, activeRole } = useUnifiedAuth();
  const location = useLocation();
  
  // RISE V3: ÚNICO loading state - apenas no primeiro load
  // Background syncs (isSyncing) NÃO bloqueiam a UI
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Verificando sessão...</p>
        </div>
      </div>
    );
  }
  
  // Não autenticado - redireciona para auth do contexto REQUERIDO
  if (!isAuthenticated) {
    const authRoute = requiredContext === "buyer" ? "/minha-conta" : "/auth";
    return <Navigate to={authRoute} state={{ from: location }} replace />;
  }
  
  // Determina se o contexto atual é "producer" ou "buyer"
  const isBuyerContext = activeRole === "buyer";
  const isProducerContext = !isBuyerContext;
  
  // Contexto errado - redireciona para dashboard do contexto ATUAL (não do requerido)
  // Isso garante que o usuário permaneça no contexto que ele escolheu
  if (requiredContext === "producer" && isBuyerContext) {
    return <Navigate to="/minha-conta/dashboard" replace />;
  }
  
  if (requiredContext === "buyer" && isProducerContext) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Tudo OK - renderiza children
  return <>{children}</>;
}
