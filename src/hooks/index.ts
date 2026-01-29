/**
 * Barrel export para hooks globais
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module hooks
 */

// Performance
export { useIsUltrawide } from "./useIsUltrawide";

// ============================================================================
// AUTH HOOKS (RISE V3: Selective Subscription Architecture)
// ============================================================================

// Full auth hook (for guards and pages that need everything)
export { useUnifiedAuth, UNIFIED_AUTH_QUERY_KEY } from "./useUnifiedAuth";
export type { UnifiedUser, UnifiedAuthState, AppRole } from "./useUnifiedAuth";

// Selective subscription hooks (for components that need specific data)
export { useAuthUser } from "./useAuthUser";
export { useAuthRole } from "./useAuthRole";
export { useAuthActions } from "./useAuthActions";

// Permissions
export { usePermissions, useHasMinRole, useCanHaveAffiliates } from "./usePermissions";
export type { Permissions } from "./usePermissions";
