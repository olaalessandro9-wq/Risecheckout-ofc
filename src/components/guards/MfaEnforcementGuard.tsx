/**
 * MFA Enforcement Guard
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Bilateral enforcement: backend marks session with `mfa_setup_required`,
 * this guard prevents navigation to any dashboard route except `/dashboard/perfil`.
 * 
 * Even if this guard is bypassed (e.g., DevTools), the backend continues
 * returning `mfa_setup_required: true` on every validate call, ensuring
 * no sensitive data is exposed without MFA.
 * 
 * @module components/guards/MfaEnforcementGuard
 * @version 1.0.0
 */

import { Navigate, useLocation } from "react-router-dom";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

interface MfaEnforcementGuardProps {
  children: React.ReactNode;
}

/**
 * Intercepts dashboard navigation for admin/owner without MFA.
 * 
 * Behavior:
 * 1. `mfaSetupRequired === false` → pass-through (render children)
 * 2. `mfaSetupRequired === true` AND route !== `/dashboard/perfil` → redirect
 * 3. `mfaSetupRequired === true` AND route === `/dashboard/perfil` → render children
 */
export function MfaEnforcementGuard({ children }: MfaEnforcementGuardProps) {
  const { mfaSetupRequired } = useUnifiedAuth();
  const location = useLocation();
  
  if (!mfaSetupRequired) {
    return <>{children}</>;
  }
  
  // Allow access ONLY to /dashboard/perfil for MFA setup
  const isOnProfilePage = location.pathname === "/dashboard/perfil";
  
  if (!isOnProfilePage) {
    return <Navigate to="/dashboard/perfil" replace />;
  }
  
  return <>{children}</>;
}
