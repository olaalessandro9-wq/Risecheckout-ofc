/**
 * useAuth - Unified authentication hook for producers
 * 
 * Uses the custom session system (producer_sessions table)
 * instead of Supabase Auth directly.
 */

import { useMemo } from "react";
import { useProducerSession } from "./useProducerSession";
import { useProducerAuth } from "./useProducerAuth";

export const useAuth = () => {
  const { producer, isValid, isLoading, clearSession } = useProducerSession();
  const { logout } = useProducerAuth();

  // FIXED: Memoize user to prevent infinite re-renders
  const user = useMemo(() => {
    if (!producer) return null;
    return {
      id: producer.id,
      email: producer.email,
      user_metadata: {
        name: producer.name,
        phone: producer.phone,
        avatar_url: producer.avatar_url,
      },
      role: producer.role,
    };
  }, [producer]);

  const signOut = async () => {
    await logout();
    clearSession();
  };

  return { 
    user, 
    session: isValid ? { user } : null,
    loading: isLoading, 
    signOut,
    // Additional fields for convenience
    producer,
    isAuthenticated: isValid,
  };
};
