/**
 * Unified Auth Hook
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Single hook for the unified identity architecture.
 * Replaces: useProducerSession, useBuyerSession, useBuyerAuth
 * 
 * Features:
 * - One authentication state for all contexts
 * - Automatic role detection
 * - Context switching without re-authentication
 * 
 * @module hooks/useUnifiedAuth
 */

import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SUPABASE_URL } from "@/config/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger("useUnifiedAuth");

// ============================================================================
// TYPES
// ============================================================================

export type AppRole = "owner" | "admin" | "user" | "seller" | "buyer";

export interface UnifiedUser {
  id: string;
  email: string;
  name: string | null;
}

export interface UnifiedAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UnifiedUser | null;
  roles: AppRole[];
  activeRole: AppRole | null;
  expiresIn: number | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const AUTH_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const AUTH_CACHE_TIME = 10 * 60 * 1000; // 10 minutes

const UNIFIED_AUTH_QUERY_KEY = ["unified-auth"] as const;

// ============================================================================
// API CALLS
// ============================================================================

interface ValidateResponse {
  valid: boolean;
  user?: UnifiedUser;
  roles?: AppRole[];
  activeRole?: AppRole;
  expiresIn?: number;
}

interface LoginRequest {
  email: string;
  password: string;
  preferredRole?: AppRole;
}

interface LoginResponse {
  success: boolean;
  user?: UnifiedUser;
  roles?: AppRole[];
  activeRole?: AppRole;
  expiresIn?: number;
  error?: string;
}

interface SwitchContextResponse {
  success: boolean;
  activeRole?: AppRole;
  availableRoles?: AppRole[];
  error?: string;
}

async function validateSession(): Promise<ValidateResponse> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-auth/validate`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      return { valid: false };
    }
    
    return await response.json();
  } catch (error) {
    log.debug("Session validation failed", error);
    return { valid: false };
  }
}

async function loginUser(request: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  
  return await response.json();
}

async function logoutUser(): Promise<void> {
  await fetch(`${SUPABASE_URL}/functions/v1/unified-auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
}

async function switchContextApi(targetRole: AppRole): Promise<SwitchContextResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-auth/switch-context`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetRole }),
  });
  
  return await response.json();
}

async function refreshSession(): Promise<ValidateResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!response.ok) {
    return { valid: false };
  }
  
  const data = await response.json();
  return {
    valid: data.success,
    user: data.user,
    roles: data.roles,
    activeRole: data.activeRole,
    expiresIn: data.expiresIn,
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function useUnifiedAuth() {
  const queryClient = useQueryClient();
  
  // Main auth state query
  const authQuery = useQuery({
    queryKey: UNIFIED_AUTH_QUERY_KEY,
    queryFn: validateSession,
    staleTime: AUTH_STALE_TIME,
    gcTime: AUTH_CACHE_TIME,
    retry: false,
    refetchOnWindowFocus: true,
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      if (data.success && data.user) {
        queryClient.setQueryData(UNIFIED_AUTH_QUERY_KEY, {
          valid: true,
          user: data.user,
          roles: data.roles,
          activeRole: data.activeRole,
          expiresIn: data.expiresIn,
        });
      }
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(UNIFIED_AUTH_QUERY_KEY, { valid: false });
      queryClient.invalidateQueries();
    },
  });
  
  // Switch context mutation
  const switchContextMutation = useMutation({
    mutationFn: switchContextApi,
    onSuccess: (data) => {
      if (data.success) {
        // Update the cached auth state with new role
        queryClient.setQueryData(UNIFIED_AUTH_QUERY_KEY, (old: ValidateResponse | undefined) => ({
          ...old,
          activeRole: data.activeRole,
        }));
      }
    },
  });
  
  // Refresh mutation
  const refreshMutation = useMutation({
    mutationFn: refreshSession,
    onSuccess: (data) => {
      if (data.valid) {
        queryClient.setQueryData(UNIFIED_AUTH_QUERY_KEY, data);
      }
    },
  });
  
  // Derived state
  const data = authQuery.data;
  const isAuthenticated = data?.valid ?? false;
  const user = data?.user ?? null;
  const roles = data?.roles ?? [];
  const activeRole = data?.activeRole ?? null;
  const expiresIn = data?.expiresIn ?? null;
  
  // Role checks
  const isProducer = useMemo(() => {
    if (!activeRole) return false;
    return ["owner", "admin", "user", "seller"].includes(activeRole);
  }, [activeRole]);
  
  const isBuyer = useMemo(() => {
    return activeRole === "buyer";
  }, [activeRole]);
  
  const canSwitchToProducer = useMemo(() => {
    return roles.some(r => ["owner", "admin", "user", "seller"].includes(r));
  }, [roles]);
  
  const canSwitchToBuyer = useMemo(() => {
    // Everyone can be a buyer
    return true;
  }, []);
  
  // Actions
  const login = useCallback(async (email: string, password: string, preferredRole?: AppRole) => {
    return loginMutation.mutateAsync({ email, password, preferredRole });
  }, [loginMutation]);
  
  const logout = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);
  
  const switchToProducer = useCallback(async () => {
    // Find the best producer role
    const producerRole = roles.find(r => ["owner", "admin", "user", "seller"].includes(r)) || "user";
    return switchContextMutation.mutateAsync(producerRole as AppRole);
  }, [roles, switchContextMutation]);
  
  const switchToBuyer = useCallback(async () => {
    return switchContextMutation.mutateAsync("buyer");
  }, [switchContextMutation]);
  
  const switchContext = useCallback(async (targetRole: AppRole) => {
    return switchContextMutation.mutateAsync(targetRole);
  }, [switchContextMutation]);
  
  const refresh = useCallback(async () => {
    return refreshMutation.mutateAsync();
  }, [refreshMutation]);
  
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: UNIFIED_AUTH_QUERY_KEY });
  }, [queryClient]);
  
  return {
    // State
    isAuthenticated,
    isLoading: authQuery.isLoading,
    isRefetching: authQuery.isRefetching,
    user,
    roles,
    activeRole,
    expiresIn,
    
    // Role checks
    isProducer,
    isBuyer,
    canSwitchToProducer,
    canSwitchToBuyer,
    
    // Actions
    login,
    logout,
    switchToProducer,
    switchToBuyer,
    switchContext,
    refresh,
    invalidate,
    
    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isSwitching: switchContextMutation.isPending,
    loginError: loginMutation.error?.message ?? null,
  };
}

// ============================================================================
// QUERY KEY EXPORT (for external invalidation)
// ============================================================================

export { UNIFIED_AUTH_QUERY_KEY };
