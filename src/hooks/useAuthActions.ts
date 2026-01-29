/**
 * useAuthActions - Selective Subscription Hook for Auth Actions
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Provides auth actions (logout, refresh, invalidate) without subscribing
 * to state changes. Perfect for components that only need to trigger actions.
 * 
 * Use cases:
 * - Logout buttons
 * - Session refresh triggers
 * - Auth state invalidation
 * 
 * @module hooks/useAuthActions
 */

import { useCallback } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unifiedTokenService } from "@/lib/token-manager";
import { createLogger } from "@/lib/logger";

const log = createLogger("useAuthActions");

// ============================================================================
// CONSTANTS
// ============================================================================

const UNIFIED_AUTH_QUERY_KEY = ["unified-auth"] as const;

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function logoutUser(): Promise<void> {
  await api.publicCall("unified-auth/logout", {});
}

// ============================================================================
// HOOK
// ============================================================================

interface AuthActions {
  /** Logout the current user */
  logout: () => Promise<void>;
  /** Invalidate auth cache (triggers refetch) */
  invalidate: () => void;
  /** Whether logout is in progress */
  isLoggingOut: boolean;
}

/**
 * Selective subscription hook for auth actions.
 * 
 * This hook provides action functions WITHOUT subscribing to auth state,
 * preventing re-renders when auth data changes.
 * 
 * @example
 * ```tsx
 * function LogoutButton() {
 *   const { logout, isLoggingOut } = useAuthActions();
 *   
 *   return (
 *     <Button onClick={logout} disabled={isLoggingOut}>
 *       {isLoggingOut ? "Saindo..." : "Sair"}
 *     </Button>
 *   );
 * }
 * ```
 */
export function useAuthActions(): AuthActions {
  const queryClient = useQueryClient();
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(UNIFIED_AUTH_QUERY_KEY, { valid: false });
      queryClient.invalidateQueries();
      log.info("Clearing TokenService on logout");
      unifiedTokenService.clearTokens();
    },
  });
  
  const logout = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);
  
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: UNIFIED_AUTH_QUERY_KEY });
  }, [queryClient]);
  
  return {
    logout,
    invalidate,
    isLoggingOut: logoutMutation.isPending,
  };
}
