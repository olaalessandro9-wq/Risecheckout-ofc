/**
 * RoleChangeDialog - Dialog de confirmação com Step-Up MFA do Owner
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Exige o código TOTP do Owner para confirmar alteração de role.
 * O código é validado pelo backend (manage-user-role), não localmente.
 * 
 * @version 2.0.0 - Step-Up MFA Owner integration
 */

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import type { AppRole } from "@/hooks/usePermissions";
import { ROLE_LABELS, ROLE_COLORS } from "../../types/admin.types";
import { OwnerMfaInput } from "@/components/auth/OwnerMfaInput";

interface RoleChangeDialogProps {
  open: boolean;
  userName: string;
  currentRole: AppRole;
  newRole: AppRole;
  isPending: boolean;
  error?: string | null;
  onConfirm: (ownerMfaCode: string) => void;
  onCancel: () => void;
}

export function RoleChangeDialog({
  open,
  userName,
  currentRole,
  newRole,
  isPending,
  error,
  onConfirm,
  onCancel,
}: RoleChangeDialogProps) {
  const [mfaCode, setMfaCode] = useState("");

  const handleCancel = () => {
    setMfaCode("");
    onCancel();
  };

  const handleConfirm = () => {
    onConfirm(mfaCode);
  };

  const isCodeComplete = mfaCode.length === 6;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar alteração de role</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Você está prestes a alterar o role de{" "}
                <strong>{userName}</strong> de{" "}
                <Badge variant="outline" className={ROLE_COLORS[currentRole]}>
                  {ROLE_LABELS[currentRole]}
                </Badge>{" "}
                para{" "}
                <Badge variant="outline" className={ROLE_COLORS[newRole]}>
                  {ROLE_LABELS[newRole]}
                </Badge>
                .
              </p>
              <p className="text-xs text-muted-foreground">
                Esta ação será registrada no log de segurança.
              </p>

              <OwnerMfaInput
                value={mfaCode}
                onChange={setMfaCode}
                error={error}
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
          >
            {isPending ? "Verificando..." : "Confirmar com MFA"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
