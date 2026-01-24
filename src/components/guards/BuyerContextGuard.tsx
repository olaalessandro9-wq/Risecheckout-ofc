/**
 * BuyerContextGuard
 * 
 * RISE Protocol V3 - Context-Aware Route Guard
 * 
 * Protege rotas de aluno/comprador.
 * Se o usuário está no contexto "producer", redireciona para /dashboard.
 * 
 * Estilo Cakto: Não permite acesso ao painel de aluno se contexto é produtor.
 * A ÚNICA forma de trocar é clicando explicitamente no menu de contexto.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { Loader2 } from "lucide-react";

interface BuyerContextGuardProps {
  children: React.ReactNode;
}

export function BuyerContextGuard({ children }: BuyerContextGuardProps) {
  const { isAuthenticated, isLoading, activeRole } = useUnifiedAuth();
  const location = useLocation();
  
  // Loading state - show spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Not authenticated - redirect to buyer auth page
  if (!isAuthenticated) {
    return <Navigate to="/minha-conta" state={{ from: location }} replace />;
  }
  
  // Context is NOT "buyer" - BLOCK access to buyer routes
  // Redirect to producer dashboard (Cakto-style enforcement)
  if (activeRole !== "buyer") {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Context is buyer - allow access
  return <>{children}</>;
}
