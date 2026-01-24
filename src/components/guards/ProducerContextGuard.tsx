/**
 * ProducerContextGuard
 * 
 * RISE Protocol V3 - Context-Aware Route Guard
 * 
 * Protege rotas de produtor.
 * Se o usuário está no contexto "buyer", redireciona para /minha-conta/dashboard.
 * 
 * Estilo Cakto: Não permite acesso ao painel de produtor se contexto é aluno.
 * A ÚNICA forma de trocar é clicando explicitamente no menu de contexto.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { Loader2 } from "lucide-react";

interface ProducerContextGuardProps {
  children: React.ReactNode;
}

export function ProducerContextGuard({ children }: ProducerContextGuardProps) {
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
  
  // Not authenticated - redirect to auth page
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // Context is "buyer" - BLOCK access to producer routes
  // Redirect to buyer dashboard (Cakto-style enforcement)
  if (activeRole === "buyer") {
    return <Navigate to="/minha-conta/dashboard" replace />;
  }
  
  // Context is producer (owner/admin/user/seller) - allow access
  return <>{children}</>;
}
