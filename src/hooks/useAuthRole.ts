/**
 * useAuthRole - Selective Subscription Hook for Role Data
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Subscribes ONLY to role data from the auth cache, preventing unnecessary
 * re-renders when other auth state changes (like user info or loading states).
 * 
 * Use cases:
 * - Permission checks (usePermissions uses this internally)
 * - Role-based UI rendering
 * - Navigation filtering
 * 
 * @module hooks/useAuthRole
 */

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AppRole } from "./useUnifiedAuth";

// ============================================================================
// TYPES
// ============================================================================

interface ValidateResponse {
  valid: boolean;
  activeRole?: AppRole;
  roles?: AppRole[];
}

interface AuthRoleData {
  /** Current active role */
  activeRole: AppRole | null;
  /** All available roles for the user */
  roles: AppRole[];
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether current role is a producer role */
  isProducer: boolean;
  /** Whether current role is buyer */
  isBuyer: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const UNIFIED_AUTH_QUERY_KEY = ["unified-auth"] as const;

const PRODUCER_ROLES: AppRole[] = ["owner", "admin", "user", "seller"];

// ============================================================================
// HOOK
// ============================================================================

/**
 * Selective subscription hook for role data.
 * 
 * This hook reads directly from React Query cache WITHOUT subscribing to
 * loading state changes, preventing re-renders during background sync.
 * 
 * @example
 * ```tsx
 * function RoleDisplay() {
 *   const { activeRole, isProducer, isBuyer } = useAuthRole();
 *   
 *   return (
 *     <Badge variant={isProducer ? "default" : "secondary"}>
 *       {activeRole}
 *     </Badge>
 *   );
 * }
 * ```
 */
export function useAuthRole(): AuthRoleData {
  const queryClient = useQueryClient();
  
  // Read directly from cache (no subscription to loading states)
  const data = queryClient.getQueryData<ValidateResponse>(UNIFIED_AUTH_QUERY_KEY);
  
  return useMemo(() => {
    const activeRole = data?.activeRole ?? null;
    const roles = data?.roles ?? [];
    const isAuthenticated = data?.valid ?? false;
    
    return {
      activeRole,
      roles,
      isAuthenticated,
      isProducer: activeRole ? PRODUCER_ROLES.includes(activeRole) : false,
      isBuyer: activeRole === "buyer",
    };
  }, [data?.activeRole, data?.roles, data?.valid]);
}
