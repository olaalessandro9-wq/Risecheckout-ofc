/**
 * UnsavedChangesGuard - Componente para proteger páginas com alterações não salvas
 * 
 * Usa useNavigationBlocker para interceptar navegação e mostra AlertDialog
 * para confirmação antes de descartar alterações.
 * 
 * Uso:
 * <UnsavedChangesGuard isDirty={hasUnsavedChanges}>
 *   <YourComponent />
 * </UnsavedChangesGuard>
 */

import { PropsWithChildren } from "react";
import { useNavigationBlocker } from "@/hooks/useNavigationBlocker";
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

interface UnsavedChangesGuardProps extends PropsWithChildren {
  /** Se há alterações não salvas */
  isDirty: boolean;
  /** Título do diálogo (opcional) */
  title?: string;
  /** Descrição do diálogo (opcional) */
  description?: string;
  /** Texto do botão de cancelar (opcional) */
  cancelText?: string;
  /** Texto do botão de confirmar (opcional) */
  confirmText?: string;
}

export function UnsavedChangesGuard({
  children,
  isDirty,
  title = "Alterações não salvas",
  description = "Você tem alterações que ainda não foram salvas. Se sair agora, essas alterações serão perdidas.",
  cancelText = "Continuar editando",
  confirmText = "Descartar alterações",
}: UnsavedChangesGuardProps) {
  const { isBlocked, proceed, cancel } = useNavigationBlocker({ isDirty });

  return (
    <>
      {children}
      
      <AlertDialog open={isBlocked}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancel}>
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={proceed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
