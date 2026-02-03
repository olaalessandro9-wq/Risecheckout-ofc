/**
 * OfflineIndicator
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Displays a non-intrusive banner when the user loses internet connection.
 * Automatically hides when connection is restored.
 * 
 * @module checkout-public/components
 */

import React, { memo, useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to track online/offline status
 */
function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Offline indicator banner
 * 
 * Shows a fixed banner at the top of the screen when offline.
 * Provides visual feedback with auto-dismiss when back online.
 */
export const OfflineIndicator = memo(function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Track when we go offline and show reconnected message
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Show offline banner
  if (!isOnline) {
    return (
      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-2 px-4"
        role="alert"
        aria-live="assertive"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
          <WifiOff className="w-4 h-4" />
          <span>Sem conexão com a internet. Verifique sua rede.</span>
        </div>
      </div>
    );
  }

  // Show reconnected message briefly
  if (showReconnected) {
    return (
      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground py-2 px-4 transition-opacity duration-500"
        role="status"
        aria-live="polite"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
          <Wifi className="w-4 h-4" />
          <span>Conexão restaurada!</span>
        </div>
      </div>
    );
  }

  return null;
});

/**
 * Hook version for components that need to react to offline status
 */
export { useOnlineStatus };
