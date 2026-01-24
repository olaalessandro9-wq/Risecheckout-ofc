/**
 * ProducerRoute
 * 
 * RISE Protocol V3 - Producer Context Route Protection
 * 
 * Alias para ContextAwareProtectedRoute com requiredContext="producer".
 * Use este componente para proteger rotas de produtor.
 */

import { ContextAwareProtectedRoute } from "./ContextAwareProtectedRoute";

interface ProducerRouteProps {
  children: React.ReactNode;
}

export function ProducerRoute({ children }: ProducerRouteProps) {
  return (
    <ContextAwareProtectedRoute requiredContext="producer">
      {children}
    </ContextAwareProtectedRoute>
  );
}
