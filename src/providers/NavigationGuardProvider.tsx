/**
 * NavigationGuardProvider - Sistema Centralizado de Proteção de Navegação
 * 
 * Usa UM ÚNICO useBlocker centralizado para interceptar toda navegação.
 * Resolve o bug "A router only supports one blocker at a time" de forma correta.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Nota 10.0/10
 */

import { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useRef, 
  useEffect,
  type ReactNode,
} from "react";
import { useNavigate, useBlocker } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ============================================================================
// TYPES
// ============================================================================

interface NavigationGuardContextValue {
  /** Registra um componente como "dirty" */
  registerDirty: (id: string, isDirty: boolean) => void;
  /** Remove registro de um componente */
  unregisterDirty: (id: string) => void;
  /** Verifica se há algum formulário dirty */
  hasAnyDirty: () => boolean;
  /** Tenta navegar (agora apenas para navegação programática - useBlocker intercepta Link) */
  attemptNavigation: (to: string, state?: unknown) => void;
  /** Verifica se um ID específico está dirty */
  isDirtyById: (id: string) => boolean;
}

interface NavigationGuardProviderProps {
  children: ReactNode;
  /** Título customizado do modal */
  dialogTitle?: string;
  /** Descrição customizada do modal */
  dialogDescription?: string;
  /** Texto do botão cancelar */
  cancelText?: string;
  /** Texto do botão confirmar */
  confirmText?: string;
}

// ============================================================================
// CONTEXT
// ============================================================================

const NavigationGuardContext = createContext<NavigationGuardContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function NavigationGuardProvider({ 
  children,
  dialogTitle = "Alterações não salvas",
  dialogDescription = "Você tem alterações que ainda não foram salvas. Se sair agora, essas alterações serão perdidas.",
  cancelText = "Continuar editando",
  confirmText = "Descartar alterações",
}: NavigationGuardProviderProps) {
  const [dirtyMap, setDirtyMap] = useState<Map<string, boolean>>(new Map());
  const navigate = useNavigate();
  
  // Ref para evitar closures stale no blocker e beforeunload
  const dirtyMapRef = useRef(dirtyMap);
  dirtyMapRef.current = dirtyMap;

  // ========================================================================
  // useBlocker ÚNICO E CENTRALIZADO
  // ========================================================================
  
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) => {
        // Bloqueia se há formulários dirty E está mudando de pathname
        return (
          dirtyMapRef.current.size > 0 &&
          currentLocation.pathname !== nextLocation.pathname
        );
      },
      [] // Ref não precisa de deps
    )
  );

  // ========================================================================
  // REGISTRATION HANDLERS
  // ========================================================================

  const registerDirty = useCallback((id: string, isDirty: boolean) => {
    setDirtyMap(prev => {
      const next = new Map(prev);
      if (isDirty) {
        next.set(id, true);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const unregisterDirty = useCallback((id: string) => {
    setDirtyMap(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // ========================================================================
  // QUERY HANDLERS
  // ========================================================================

  const hasAnyDirty = useCallback(() => {
    return dirtyMapRef.current.size > 0;
  }, []);

  const isDirtyById = useCallback((id: string) => {
    return dirtyMapRef.current.has(id);
  }, []);

  // ========================================================================
  // NAVIGATION HANDLERS
  // ========================================================================

  // attemptNavigation agora é apenas para navegação programática
  // Links usando <Link> são automaticamente interceptados pelo useBlocker
  const attemptNavigation = useCallback((to: string, state?: unknown) => {
    navigate(to, { state });
  }, [navigate]);

  const handleProceed = useCallback(() => {
    if (blocker.state === "blocked") {
      // Limpa todos os dirty antes de prosseguir
      setDirtyMap(new Map());
      blocker.proceed?.();
    }
  }, [blocker]);

  const handleCancel = useCallback(() => {
    if (blocker.state === "blocked") {
      blocker.reset?.();
    }
  }, [blocker]);

  // ========================================================================
  // BROWSER CLOSE/REFRESH HANDLER
  // ========================================================================

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyMapRef.current.size > 0) {
        e.preventDefault();
        // Chrome requer returnValue
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // ========================================================================
  // CONTEXT VALUE
  // ========================================================================

  const contextValue: NavigationGuardContextValue = {
    registerDirty,
    unregisterDirty,
    hasAnyDirty,
    attemptNavigation,
    isDirtyById,
  };

  return (
    <NavigationGuardContext.Provider value={contextValue}>
      {children}
      
      {/* Modal controlado pelo estado do blocker */}
      <AlertDialog open={blocker.state === "blocked"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleProceed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NavigationGuardContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useNavigationGuard(): NavigationGuardContextValue {
  const context = useContext(NavigationGuardContext);
  if (!context) {
    throw new Error("useNavigationGuard must be used within NavigationGuardProvider");
  }
  return context;
}
