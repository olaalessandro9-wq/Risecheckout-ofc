/**
 * Session Commander Feedback - Visual User Notifications
 * 
 * RISE ARCHITECT PROTOCOL V3 - Session Commander Architecture
 * 
 * Provides visual feedback for session state changes.
 */

import { toast } from "sonner";

// ============================================
// TOAST IDS (For updating existing toasts)
// ============================================

const TOAST_IDS = {
  RECONNECTING: "session-reconnecting",
  SESSION_STATUS: "session-status",
} as const;

// ============================================
// RECONNECTION FEEDBACK
// ============================================

/**
 * Show reconnecting toast
 * 
 * @param attempt - Current retry attempt number
 * @param maxAttempts - Maximum attempts allowed
 */
export function showReconnecting(attempt: number, maxAttempts: number): void {
  toast.loading(`Reconectando... (${attempt}/${maxAttempts})`, {
    id: TOAST_IDS.RECONNECTING,
    description: "Restaurando sua sessão",
    duration: Infinity,
  });
}

/**
 * Show successful reconnection toast
 */
export function showReconnected(): void {
  toast.success("Conectado!", {
    id: TOAST_IDS.RECONNECTING,
    description: "Sessão restaurada com sucesso",
    duration: 3000,
  });
}

/**
 * Show reconnection failed toast
 */
export function showReconnectionFailed(): void {
  toast.error("Falha na reconexão", {
    id: TOAST_IDS.RECONNECTING,
    description: "Não foi possível restaurar a sessão",
    duration: 5000,
  });
}

// ============================================
// SESSION EXPIRATION FEEDBACK
// ============================================

/**
 * Show session expired toast with login action
 */
export function showSessionExpired(): void {
  toast.error("Sessão expirada", {
    id: TOAST_IDS.SESSION_STATUS,
    description: "Faça login novamente para continuar",
    duration: 10000,
    action: {
      label: "Login",
      onClick: () => {
        // Get current pathname for redirect
        const currentPath = window.location.pathname;
        const searchParams = new URLSearchParams();
        if (currentPath && currentPath !== "/" && currentPath !== "/auth") {
          searchParams.set("redirectTo", currentPath);
        }
        const redirectParam = searchParams.toString();
        window.location.href = `/auth${redirectParam ? `?${redirectParam}` : ""}`;
      },
    },
  });
}

/**
 * Show session expiring soon warning
 * 
 * @param minutesLeft - Minutes until expiration
 */
export function showSessionExpiringSoon(minutesLeft: number): void {
  toast.warning("Sessão expirando", {
    id: TOAST_IDS.SESSION_STATUS,
    description: `Sua sessão expira em ${minutesLeft} minutos`,
    duration: 8000,
  });
}

// ============================================
// NETWORK STATUS FEEDBACK
// ============================================

/**
 * Show offline status toast
 */
export function showOffline(): void {
  toast.warning("Sem conexão", {
    id: "network-status",
    description: "Verifique sua conexão com a internet",
    duration: Infinity,
  });
}

/**
 * Show back online toast
 */
export function showOnline(): void {
  toast.success("Conectado", {
    id: "network-status",
    description: "Conexão restaurada",
    duration: 3000,
  });
}

// ============================================
// DISMISS HELPERS
// ============================================

/**
 * Dismiss all session-related toasts
 */
export function dismissSessionToasts(): void {
  toast.dismiss(TOAST_IDS.RECONNECTING);
  toast.dismiss(TOAST_IDS.SESSION_STATUS);
}
