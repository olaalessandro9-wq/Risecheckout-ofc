/**
 * UserActionDialog - Dialog de confirmação de ações do usuário
 * 
 * RISE Protocol V3 - Componente puro
 * 
 * @version 1.0.0
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { UserActionDialog as UserActionDialogType } from "../../types/admin.types";

interface UserActionDialogProps {
  dialog: UserActionDialogType | null;
  userName: string;
  customFee: string;
  statusReason: string;
  onStatusReasonChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UserActionDialog({
  dialog,
  userName,
  customFee,
  statusReason,
  onStatusReasonChange,
  onConfirm,
  onCancel,
}: UserActionDialogProps) {
  if (!dialog) return null;

  const isDestructive =
    dialog.type === "ban" ||
    (dialog.type === "productAction" && dialog.productAction === "delete");

  return (
    <AlertDialog open={dialog.open} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {dialog.type === "suspend" && (
                <p>
                  Você está prestes a <strong>suspender</strong> o usuário{" "}
                  <strong>{userName}</strong>. O usuário não poderá acessar a
                  plataforma até ser reativado.
                </p>
              )}
              {dialog.type === "ban" && (
                <p>
                  Você está prestes a <strong>banir permanentemente</strong> o
                  usuário <strong>{userName}</strong>.
                </p>
              )}
              {dialog.type === "activate" && (
                <p>
                  Você está prestes a <strong>reativar</strong> o usuário{" "}
                  <strong>{userName}</strong>.
                </p>
              )}
              {dialog.type === "updateFee" && (
                <p>
                  Você está prestes a definir uma taxa personalizada de{" "}
                  <strong>{customFee}%</strong> para o usuário{" "}
                  <strong>{userName}</strong>.
                </p>
              )}
              {dialog.type === "resetFee" && (
                <p>
                  Você está prestes a <strong>resetar</strong> a taxa do usuário{" "}
                  <strong>{userName}</strong> para o padrão (4%).
                </p>
              )}
              {dialog.type === "productAction" && (
                <p>
                  Você está prestes a{" "}
                  <strong>
                    {dialog.productAction === "activate"
                      ? "ativar"
                      : dialog.productAction === "block"
                      ? "bloquear"
                      : "remover"}
                  </strong>{" "}
                  o produto <strong>{dialog.productName}</strong>.
                </p>
              )}

              {(dialog.type === "suspend" || dialog.type === "ban") && (
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo (opcional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Descreva o motivo..."
                    value={statusReason}
                    onChange={(e) => onStatusReasonChange(e.target.value)}
                  />
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Esta ação será registrada no log de segurança.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={isDestructive ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
