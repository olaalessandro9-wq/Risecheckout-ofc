/**
 * Unified Auth Hook
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * RISE V3 EXCEPTION: FILE LENGTH (~306 lines)
 * 
 * This file marginally exceeds the 300-line limit due to its role as the
 * Single Source of Truth (SSOT) for frontend authentication state.
 * Splitting it would fragment the auth state machine and harm DX.
 * 
 * Exception reviewed and approved: 2026-01-23
 * ═══════════════════════════════════════════════════════════════════════════
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

import { useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import { unifiedTokenService } from "@/lib/token-manager";
import { sessionCommander } from "@/lib/session-commander";

const log = createLogger("useUnifiedAuth");

// ============================================================================
// TYPES
// ============================================================================

export type AppRole = "owner" | "admin" | "user" | "seller" | "buyer";

export interface UnifiedUser {
  id: string;
  email: string;
  name: string | null;
  timezone: string | null;
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

// RISE V3 10.0/10: staleTime: 0 força revalidação a cada mount
// AUTH_STALE_TIME removido - não mais utilizado
const AUTH_CACHE_TIME = 10 * 60 * 1000; // 10 minutes (gcTime)

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

/**
 * RISE V3: Validate-First Strategy (Padrão Hotmart/Cakto/Kiwify)
 * 
 * SEMPRE chama o backend para validar sessão. O backend é o SSOT.
 * O backend já implementa auto-refresh quando o access token expira
 * mas o refresh token ainda é válido (unified-auth/handlers/validate.ts).
 * 
 * Esta abordagem elimina o deadlock de cold start onde o TokenService
 * inicia em state="idle" e impedia qualquer chamada de rede.
 * 
 * @see docs/UNIFIED_AUTH_SYSTEM.md
 */
async function validateSession(): Promise<ValidateResponse> {
  try {
    // RISE V3: SEMPRE chamar o backend - ele é o SSOT (Single Source of Truth)
    // Os cookies HttpOnly (__Secure-rise_*) são enviados automaticamente
    // O backend valida e faz auto-refresh se necessário
    log.debug("Validating session with backend (Validate-First strategy)");
    
    const { data, error } = await api.publicCall<ValidateResponse>("unified-auth/validate", {});
    
    if (error || !data) {
      log.debug("Session validation failed", error);
      return { valid: false };
    }
    
    log.debug("Session validation succeeded", { valid: data.valid });
    return data;
  } catch (error) {
    log.debug("Session validation exception", error);
    return { valid: false };
  }
}

async function loginUser(request: LoginRequest): Promise<LoginResponse> {
  const { data, error } = await api.publicCall<LoginResponse>("unified-auth/login", request);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return data ?? { success: false, error: "No response" };
}

async function logoutUser(): Promise<void> {
  await api.publicCall("unified-auth/logout", {});
}

async function switchContextApi(targetRole: AppRole): Promise<SwitchContextResponse> {
  const { data, error } = await api.publicCall<SwitchContextResponse>("unified-auth/switch-context", { targetRole });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return data ?? { success: false, error: "No response" };
}

async function refreshSession(): Promise<ValidateResponse> {
  const { data, error } = await api.publicCall<LoginResponse>("unified-auth/refresh", {});
  
  if (error || !data) {
    return { valid: false };
  }
  
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
    queryFn: async () => {
      const result = await validateSession();
      // RISE V3: Sync TokenService with validation result
      if (result.valid && result.expiresIn) {
        log.debug("Syncing TokenService after validation", { expiresIn: result.expiresIn });
        unifiedTokenService.setAuthenticated(result.expiresIn);
      } else if (!result.valid) {
        log.debug("Clearing TokenService - invalid session");
        unifiedTokenService.clearTokens();
      }
      return result;
    },
    // RISE V3 10.0/10: Força revalidação a cada mount
    // staleTime: 0 garante que dados são sempre "stale"
    // refetchOnMount: 'always' dispara fetch mesmo com cache
    // Isso previne o flash de form quando há navegação SPA
    staleTime: 0,
    gcTime: AUTH_CACHE_TIME,
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
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
        // RISE V3: Sync TokenService after successful login
        if (data.expiresIn) {
          log.info("Syncing TokenService after login", { expiresIn: data.expiresIn });
          unifiedTokenService.setAuthenticated(data.expiresIn);
        }
      }
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(UNIFIED_AUTH_QUERY_KEY, { valid: false });
      queryClient.invalidateQueries();
      // RISE V3: Clear TokenService on logout
      log.info("Clearing TokenService on logout");
      unifiedTokenService.clearTokens();
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
        // RISE V3: Sync TokenService after successful refresh
        if (data.expiresIn) {
          log.debug("Syncing TokenService after refresh", { expiresIn: data.expiresIn });
          unifiedTokenService.setAuthenticated(data.expiresIn);
        }
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
  
  // ========================================================================
  // TOKEN SERVICE INITIALIZATION (RISE V3 10.0/10)
  // ========================================================================
  
  /**
   * Initialize TokenService only when authenticated.
   * 
   * RISE V3: Lazy initialization prevents auth side effects in public routes.
   * TokenService is only initialized when this hook runs in an authenticated context.
   */
  useEffect(() => {
    if (isAuthenticated) {
      // Initialize TokenService when we have a valid session
      if (!unifiedTokenService.isInitialized()) {
        log.info("Initializing TokenService (lazy initialization)");
        unifiedTokenService.initialize();
      }
    }
  }, [isAuthenticated]);
  
  // ========================================================================
  // SESSION COMMANDER INTEGRATION (RISE V3 10.0/10)
  // ========================================================================
  
  /**
   * Start Session Commander monitoring when authenticated.
   * 
   * The SessionMonitor handles:
   * - Visibility changes (tab becomes visible)
   * - Network changes (coming back online)
   * - Window focus events
   * - Periodic health checks with adaptive intervals
   */
  useEffect(() => {
    if (isAuthenticated) {
      log.info("Starting Session Commander monitoring");
      sessionCommander.startMonitoring(() => {
        // Callback invoked when session should be checked
        log.debug("Session check triggered by monitor");
        invalidate();
      });
      
      return () => {
        log.debug("Stopping Session Commander monitoring");
        sessionCommander.stopMonitoring();
      };
    }
  }, [isAuthenticated, invalidate]);
  
  return {
    // State
    isAuthenticated,
    // RISE V3 10.0/10: isLoading inclui isFetching para esperar revalidação
    // isLoading = true quando fetch inicial OU quando revalidando em background
    // Isso garante que a UI espere a confirmação do backend antes de decidir
    isLoading: authQuery.isLoading || authQuery.isFetching,
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
