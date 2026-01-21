/**
 * UserInfo - Seção de informações básicas do usuário
 * 
 * RISE Protocol V3 - Componente puro
 * 
 * @version 1.0.0
 */

import { Badge } from "@/components/ui/badge";
import { Mail, Shield, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AppRole } from "@/hooks/usePermissions";
import { USER_STATUS_LABELS, USER_STATUS_COLORS } from "../../types/admin.types";

interface UserInfoProps {
  userEmail?: string;
  userRole: AppRole;
  status: string;
  statusReason?: string;
  createdAt?: string;
}

export function UserInfo({
  userEmail,
  userRole,
  status,
  statusReason,
  createdAt,
}: UserInfoProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <span>{userEmail || "Email não disponível"}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <span>Role: {userRole}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span>
          Cadastrado em:{" "}
          {createdAt
            ? format(new Date(createdAt), "dd/MM/yyyy", { locale: ptBR })
            : "-"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Status:</span>
        <Badge variant="outline" className={USER_STATUS_COLORS[status]}>
          {USER_STATUS_LABELS[status]}
        </Badge>
      </div>
      {statusReason && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
          Motivo: {statusReason}
        </div>
      )}
    </div>
  );
}
