/**
 * UserActionDialog - Dialog de confirmação com Step-Up MFA do Owner
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * @version 2.0.0 - Step-Up MFA Owner integration
 */

import { useState, useEffect } from "react";
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
import { OwnerMfaInput } from "@/components/auth/OwnerMfaInput";
import type { UserActionDialog as UserActionDialogType } from "../../types/admin.types";

interface UserActionDialogProps {
  dialog: UserActionDialogType | null;
  userName: string;
  customFee: string;
  statusReason: string;
  isPending?: boolean;
  mfaError?: string | null;
  onStatusReasonChange: (value: string) => void;
  onConfirm: (ownerMfaCode: string) => void;
  onCancel: () => void;
}

export function UserActionDialog({
  dialog,
  userName,
  customFee,
  statusReason,
  isPending = false,
  mfaError,
  onStatusReasonChange,
  onConfirm,
  onCancel,
}: UserActionDialogProps) {
  const [mfaCode, setMfaCode] = useState("");

  // Clear stale TOTP code when backend returns MFA error
  useEffect(() => {
    if (mfaError) {
      setMfaCode("");
    }
  }, [mfaError]);

  if (!dialog) return null;

  const isDestructive =
    dialog.type === "ban" ||
    (dialog.type === "productAction" && dialog.productAction === "delete");

  const handleCancel = () => {
    setMfaCode("");
    onCancel();
  };

  const handleConfirm = () => {
    onConfirm(mfaCode);
  };

  const isCodeComplete = mfaCode.length === 6;

  return (
    <AlertDialog open={dialog.open} onOpenChange={(open) => !open && handleCancel()}>
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

              <OwnerMfaInput
                value={mfaCode}
                onChange={setMfaCode}
                error={mfaError}
                disabled={isPending}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending || !isCodeComplete}
            className={isDestructive ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            {isPending ? "Verificando..." : "Confirmar com MFA"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
