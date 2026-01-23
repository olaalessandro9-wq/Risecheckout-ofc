/**
 * useAuth - Unified authentication hook (Legacy Alias)
 * 
 * @deprecated Use `useUnifiedAuth` directly instead.
 * 
 * This hook is maintained for backward compatibility.
 * It wraps useUnifiedAuth and maps the interface to the legacy format.
 */

import { useMemo } from "react";
import { useUnifiedAuth } from "./useUnifiedAuth";

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, logout, activeRole } = useUnifiedAuth();

  // FIXED: Memoize user to prevent infinite re-renders
  const mappedUser = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      user_metadata: {
        name: user.name,
        phone: null, // Not available in unified user
        avatar_url: null, // Not available in unified user
      },
      role: activeRole || "user",
    };
  }, [user, activeRole]);

  const signOut = async () => {
    await logout();
  };

  return { 
    user: mappedUser, 
    session: isAuthenticated ? { user: mappedUser } : null,
    loading: isLoading, 
    signOut,
    // Additional fields for convenience
    producer: user ? {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: null,
      role: activeRole || "user",
      avatar_url: null,
    } : null,
    isAuthenticated,
  };
};
