/**
 * useNavigationBlocker - Hook para bloquear navegação com alterações não salvas
 * 
 * Usa useBlocker do React Router v6 (disponível apenas com createBrowserRouter)
 * para interceptar navegação e mostrar diálogo de confirmação.
 * 
 * Também adiciona listener beforeunload para fechar aba/janela.
 */

import { useEffect, useCallback } from "react";
import { useBlocker } from "react-router-dom";

interface UseNavigationBlockerOptions {
  /** Se há alterações não salvas que devem bloquear navegação */
  isDirty: boolean;
  /** Mensagem customizada para o diálogo (opcional) */
  message?: string;
}

interface UseNavigationBlockerReturn {
  /** Se o bloqueador está ativo (mostrando diálogo) */
  isBlocked: boolean;
  /** Confirma a navegação (descarta alterações) */
  proceed: () => void;
  /** Cancela a navegação (permanece na página) */
  cancel: () => void;
}

export function useNavigationBlocker({
  isDirty,
  message = "Você tem alterações não salvas. Deseja realmente sair?",
}: UseNavigationBlockerOptions): UseNavigationBlockerReturn {
  
  // Bloqueia navegação interna do React Router
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Bloqueia fechamento da aba/janela (beforeunload)
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Chrome requer returnValue para mostrar diálogo
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, message]);

  // Callbacks para o diálogo
  const proceed = useCallback(() => {
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  }, [blocker]);

  const cancel = useCallback(() => {
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }, [blocker]);

  return {
    isBlocked: blocker.state === "blocked",
    proceed,
    cancel,
  };
}
