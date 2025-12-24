/**
 * RoleProtectedRoute - Componente de proteção de rotas por role
 * 
 * Uso:
 * <RoleProtectedRoute requiredRole="admin">
 *   <AdminPanel />
 * </RoleProtectedRoute>
 * 
 * Ou com permissão específica:
 * <RoleProtectedRoute requiredPermission="canHaveAffiliates">
 *   <AffiliatesManagement />
 * </RoleProtectedRoute>
 * 
 * IMPORTANTE: Este componente é uma camada de segurança ADICIONAL.
 * A validação real DEVE ocorrer nas Edge Functions.
 */

import { Navigate, useLocation } from "react-router-dom";
import { usePermissions, AppRole, Permissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  
  // Opção 1: Exigir role mínimo
  requiredRole?: AppRole;
  
  // Opção 2: Exigir permissão específica
  requiredPermission?: keyof Omit<Permissions, "role" | "isLoading" | "error">;
  
  // Rota de fallback (padrão: /dashboard)
  fallbackPath?: string;
  
  // Mostrar mensagem de acesso negado em vez de redirecionar
  showAccessDenied?: boolean;
}

// Hierarquia de prioridade para comparação de roles
const ROLE_PRIORITY: Record<AppRole, number> = {
  owner: 1,
  admin: 2,
  user: 3,
  seller: 4,
};

export function RoleProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallbackPath = "/dashboard",
  showAccessDenied = false,
}: RoleProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const permissions = usePermissions();
  const location = useLocation();

  // Ainda carregando autenticação ou permissões
  if (authLoading || permissions.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Não autenticado
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Verificar acesso
  let hasAccess = true;

  if (requiredRole) {
    // Verificar se o role do usuário tem prioridade igual ou maior
    hasAccess = ROLE_PRIORITY[permissions.role] <= ROLE_PRIORITY[requiredRole];
  }

  if (requiredPermission && hasAccess) {
    // Verificar permissão específica
    hasAccess = permissions[requiredPermission] === true;
  }

  // Sem acesso
  if (!hasAccess) {
    // Log de tentativa de acesso (para auditoria client-side)
    console.warn(
      `[RoleProtectedRoute] Acesso negado: ${permissions.role} tentou acessar rota que requer ${requiredRole || requiredPermission}`,
      { path: location.pathname }
    );

    if (showAccessDenied) {
      return <AccessDeniedMessage />;
    }

    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

/**
 * Componente de mensagem de acesso negado
 */
function AccessDeniedMessage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <div className="text-6xl mb-4">🔒</div>
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Acesso Restrito
      </h2>
      <p className="text-muted-foreground text-center max-w-md">
        Você não tem permissão para acessar esta página. 
        Se você acredita que deveria ter acesso, entre em contato com o administrador.
      </p>
    </div>
  );
}

export default RoleProtectedRoute;
