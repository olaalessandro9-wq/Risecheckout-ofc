/**
 * UsersTable - Tabela de usuários pura
 * 
 * RISE Protocol V3 - Componente puro, sem lógica de estado
 * 
 * @version 1.0.0
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Eye } from "lucide-react";
import type { AppRole } from "@/hooks/usePermissions";
import type { UserWithRole, UserSortField } from "../../types/admin.types";
import {
  ROLE_LABELS,
  ROLE_COLORS,
  SOURCE_LABELS,
  SOURCE_COLORS,
} from "../../types/admin.types";
import { formatCentsToBRL } from "@/lib/money";

interface UsersTableProps {
  users: UserWithRole[];
  isLoading: boolean;
  isOwner: boolean;
  callerRole: AppRole;
  onToggleSort: (field: UserSortField) => void;
  onRoleChange: (userId: string, userName: string, currentRole: AppRole, newRole: string) => void;
  onViewDetails: (user: UserWithRole) => void;
  getAvailableRoles: (currentRole: AppRole) => AppRole[];
}

export function UsersTable({
  users,
  isLoading,
  isOwner,
  onToggleSort,
  onRoleChange,
  onViewDetails,
  getAvailableRoles,
}: UsersTableProps) {
  const colSpan = isOwner ? 9 : 6;

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => onToggleSort("name")}
              >
                Usuário
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            {isOwner && <TableHead>Email</TableHead>}
            {isOwner && <TableHead>Origem</TableHead>}
            <TableHead>Role</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => onToggleSort("gmv")}
              >
                GMV Total
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>Taxa Paga</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => onToggleSort("orders")}
              >
                Pedidos
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>Alterar Role</TableHead>
            {isOwner && <TableHead className="w-[60px]">Detalhes</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="text-center py-8">
                Carregando...
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const availableRoles = getAvailableRoles(user.role);

              return (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {user.profile?.name || "Sem nome"}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {user.user_id.slice(0, 8)}...
                      </p>
                    </div>
                  </TableCell>
                  {isOwner && (
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {user.email || "-"}
                      </span>
                    </TableCell>
                  )}
                  {isOwner && (
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={SOURCE_COLORS[user.registration_source || "producer"]}
                      >
                        {SOURCE_LABELS[user.registration_source || "producer"]}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline" className={ROLE_COLORS[user.role]}>
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        user.total_gmv > 0
                          ? "text-emerald-500 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {formatCentsToBRL(user.total_gmv)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        user.total_fees > 0
                          ? "text-blue-500 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {formatCentsToBRL(user.total_fees)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        user.orders_count > 0 ? "font-medium" : "text-muted-foreground"
                      }
                    >
                      {user.orders_count}
                    </span>
                  </TableCell>
                  <TableCell>
                    {availableRoles.length > 0 ? (
                      <Select
                        onValueChange={(value) =>
                          onRoleChange(
                            user.user_id,
                            user.profile?.name || "Usuário",
                            user.role,
                            value
                          )
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Alterar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Sem permissão
                      </span>
                    )}
                  </TableCell>
                  {isOwner && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onViewDetails(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
