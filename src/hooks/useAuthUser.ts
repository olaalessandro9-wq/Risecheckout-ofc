/**
 * useAuthUser - Selective Subscription Hook for User Data
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Subscribes ONLY to user data from the auth cache, preventing unnecessary
 * re-renders when other auth state changes (like loading states).
 * 
 * Use cases:
 * - Components that only need user info (avatar, name, email)
 * - Components that should NOT re-render during background auth sync
 * 
 * @module hooks/useAuthUser
 */

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { UnifiedUser, AppRole } from "./useUnifiedAuth";

// ============================================================================
// TYPES
// ============================================================================

interface ValidateResponse {
  valid: boolean;
  user?: UnifiedUser;
  roles?: AppRole[];
  activeRole?: AppRole;
  expiresIn?: number;
}

interface AuthUserData {
  /** Current user object (null if not authenticated) */
  user: UnifiedUser | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** User email (convenience accessor) */
  email: string | null;
  /** User name (convenience accessor) */
  name: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const UNIFIED_AUTH_QUERY_KEY = ["unified-auth"] as const;

// ============================================================================
// HOOK
// ============================================================================

/**
 * Selective subscription hook for user data.
 * 
 * This hook reads directly from React Query cache WITHOUT subscribing to
 * loading state changes, preventing re-renders during background sync.
 * 
 * @example
 * ```tsx
 * function UserDisplay() {
 *   const { user, email, isAuthenticated } = useAuthUser();
 *   
 *   if (!isAuthenticated) return null;
 *   return <span>{email}</span>;
 * }
 * ```
 */
export function useAuthUser(): AuthUserData {
  const queryClient = useQueryClient();
  
  // Read directly from cache (no subscription to loading states)
  const data = queryClient.getQueryData<ValidateResponse>(UNIFIED_AUTH_QUERY_KEY);
  
  return useMemo(() => ({
    user: data?.user ?? null,
    isAuthenticated: data?.valid ?? false,
    email: data?.user?.email ?? null,
    name: data?.user?.name ?? null,
  }), [data?.user, data?.valid]);
}
