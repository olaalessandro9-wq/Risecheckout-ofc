/**
 * Webhook Delete Confirmation Dialog
 * 
 * @module modules/webhooks/components
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

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
import { useWebhooks } from "../context/WebhooksContext";

export function WebhookDeleteDialog() {
  const { deletingWebhook, cancelDelete, confirmDelete, isSaving } = useWebhooks();

  const isOpen = !!deletingWebhook;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && cancelDelete()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o webhook{" "}
            <strong>{deletingWebhook?.name}</strong>? Esta ação não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            disabled={isSaving}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isSaving ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
