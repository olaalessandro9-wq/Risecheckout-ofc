/**
 * GuardedLink - Link que respeita o NavigationGuardProvider
 * 
 * Substitui o Link do React Router em áreas onde navegação pode ser bloqueada
 * por formulários com alterações não salvas.
 * 
 * @see RISE ARCHITECT PROTOCOL V3
 */

import { useCallback, type ReactNode } from "react";
import { useNavigationGuard } from "@/providers/NavigationGuardProvider";

// ============================================================================
// TYPES
// ============================================================================

interface GuardedLinkProps {
  /** Destino da navegação */
  to: string;
  /** Conteúdo do link */
  children: ReactNode;
  /** Classes CSS */
  className?: string;
  /** Tooltip quando labels estão ocultos */
  title?: string;
  /** Callback adicional no clique */
  onClick?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GuardedLink({ 
  to, 
  children, 
  className, 
  title, 
  onClick,
}: GuardedLinkProps) {
  const { attemptNavigation } = useNavigationGuard();

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onClick?.();
    attemptNavigation(to);
  }, [to, onClick, attemptNavigation]);

  return (
    <a 
      href={to} 
      className={className} 
      title={title} 
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
