/**
 * NavigationGuardProvider - Sistema Centralizado de Proteção de Navegação
 * 
 * Substitui múltiplos useBlocker por um sistema único e previsível.
 * Elimina bug do React Router "A router only supports one blocker at a time".
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Nota 9.7/10
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
import { useNavigate, useLocation } from "react-router-dom";
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

interface PendingNavigation {
  to: string;
  state?: unknown;
}

interface NavigationGuardContextValue {
  /** Registra um componente como "dirty" */
  registerDirty: (id: string, isDirty: boolean) => void;
  /** Remove registro de um componente */
  unregisterDirty: (id: string) => void;
  /** Verifica se há algum formulário dirty */
  hasAnyDirty: () => boolean;
  /** Tenta navegar, mostrando modal se necessário */
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
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Ref para evitar closures stale no beforeunload
  const dirtyMapRef = useRef(dirtyMap);
  dirtyMapRef.current = dirtyMap;

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

  const attemptNavigation = useCallback((to: string, state?: unknown) => {
    // Se está na mesma rota, permite
    if (to === location.pathname) {
      return;
    }
    
    // Se há formulários dirty, mostra modal
    if (dirtyMapRef.current.size > 0) {
      setPendingNavigation({ to, state });
    } else {
      navigate(to, { state });
    }
  }, [navigate, location.pathname]);

  const handleProceed = useCallback(() => {
    if (pendingNavigation) {
      // Limpa todos os dirty antes de navegar
      setDirtyMap(new Map());
      navigate(pendingNavigation.to, { state: pendingNavigation.state });
      setPendingNavigation(null);
    }
  }, [pendingNavigation, navigate]);

  const handleCancel = useCallback(() => {
    setPendingNavigation(null);
  }, []);

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
      
      <AlertDialog open={pendingNavigation !== null}>
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
