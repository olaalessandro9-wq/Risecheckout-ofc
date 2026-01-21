/**
 * RoleChangeDialog - Dialog de confirmação de alteração de role
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
import { Badge } from "@/components/ui/badge";
import type { AppRole } from "@/hooks/usePermissions";
import { ROLE_LABELS, ROLE_COLORS } from "../../types/admin.types";

interface RoleChangeDialogProps {
  open: boolean;
  userName: string;
  currentRole: AppRole;
  newRole: AppRole;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RoleChangeDialog({
  open,
  userName,
  currentRole,
  newRole,
  isPending,
  onConfirm,
  onCancel,
}: RoleChangeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar alteração de role</AlertDialogTitle>
          <AlertDialogDescription>
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
            <br />
            <br />
            Esta ação será registrada no log de segurança.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? "Alterando..." : "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
