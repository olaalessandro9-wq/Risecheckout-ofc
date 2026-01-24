/**
 * ContextAwareProtectedRoute
 * 
 * RISE Protocol V3 - Unified Context-Aware Route Protection
 * 
 * Combina autenticação + verificação de contexto em um único componente.
 * Elimina race conditions entre ProtectedRoute e Context Guards.
 * 
 * Comportamento:
 * 1. isLoading → Spinner (único, sem flash)
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
  const { isAuthenticated, isLoading, activeRole } = useUnifiedAuth();
  const location = useLocation();
  
  // ÚNICO loading state - sem gaps de renderização
  if (isLoading) {
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
