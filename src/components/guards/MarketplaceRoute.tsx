/**
 * MarketplaceRoute - Guard de Acesso ao Marketplace
 * 
 * RISE Protocol V3: Renderização condicional por role
 * - admin/owner: Renderiza Marketplace normal
 * - user/seller: Renderiza página "Em Breve"
 */

import { usePermissions } from "@/hooks/usePermissions";
import EmBreve from "@/pages/EmBreve";

interface MarketplaceRouteProps {
  children: React.ReactNode;
}

export function MarketplaceRoute({ children }: MarketplaceRouteProps) {
  const { role, isLoading } = usePermissions();

  // Aguardando permissões
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Apenas admin e owner têm acesso completo
  const hasFullAccess = role === "admin" || role === "owner";

  if (!hasFullAccess) {
    return <EmBreve titulo="Marketplace" />;
  }

  return <>{children}</>;
}
