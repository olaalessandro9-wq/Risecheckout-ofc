/**
 * GuardedLink - Link que usa React Router nativo
 * 
 * Agora usa <Link> do React Router, que é automaticamente
 * interceptado pelo useBlocker centralizado no NavigationGuardProvider.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Nota 10.0/10
 */

import { useCallback, type ReactNode } from "react";
import { Link } from "react-router-dom";

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
  /** Callback para prefetch no hover */
  onMouseEnter?: () => void;
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
  onMouseEnter,
}: GuardedLinkProps) {
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.();
    // Não previne default - deixa o React Router fazer a navegação
    // O useBlocker no Provider intercepta automaticamente se necessário
  }, [onClick]);

  return (
    <Link 
      to={to}
      className={className} 
      title={title} 
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
    >
      {children}
    </Link>
  );
}
