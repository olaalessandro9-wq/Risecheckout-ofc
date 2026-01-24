/**
 * BuyerRoute
 * 
 * RISE Protocol V3 - Buyer Context Route Protection
 * 
 * Alias para ContextAwareProtectedRoute com requiredContext="buyer".
 * Use este componente para proteger rotas de aluno/comprador.
 */

import { ContextAwareProtectedRoute } from "./ContextAwareProtectedRoute";

interface BuyerRouteProps {
  children: React.ReactNode;
}

export function BuyerRoute({ children }: BuyerRouteProps) {
  return (
    <ContextAwareProtectedRoute requiredContext="buyer">
      {children}
    </ContextAwareProtectedRoute>
  );
}
