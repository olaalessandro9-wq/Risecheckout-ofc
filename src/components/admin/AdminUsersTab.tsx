/**
 * AdminUsersTab - Aba de gerenciamento de usuários
 * 
 * Permite listar usuários e promover/rebaixar roles
 * 
 * Regras:
 * - Owner vê todos exceto ele mesmo, com emails
 * - Admin vê apenas sellers e users, sem emails
 * - Owner pode promover: seller ↔ user ↔ admin (nunca para owner)
 * - Admin pode promover: seller ↔ user apenas
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions, AppRole } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { Search, Shield, UserCog, ArrowUpDown, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserDetailSheet } from "./UserDetailSheet";

interface UserWithRole {
  user_id: string;
  role: AppRole;
  profile: {
    name: string;
  } | null;
  email?: string;
  total_gmv: number;
  total_fees: number;
  orders_count: number;
}

type SortField = "name" | "gmv" | "orders";
type SortDirection = "asc" | "desc";

const formatCentsToBRL = (cents: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
};

const ROLE_LABELS: Record<AppRole, string> = {
  owner: "Owner",
  admin: "Admin",
  user: "Usuário",
  seller: "Seller",
};

const ROLE_COLORS: Record<AppRole, string> = {
  owner: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  admin: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  user: "bg-green-500/10 text-green-500 border-green-500/20",
  seller: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export function AdminUsersTab() {
  const { role: callerRole, canManageUsers } = usePermissions();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("gmv");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    currentRole: AppRole;
    newRole: AppRole;
  } | null>(null);
  const [selectedUser, setSelectedUser] = useState<{
    userId: string;
    userName: string;
    userEmail?: string;
    userRole: AppRole;
    totalGmv: number;
    totalFees: number;
    ordersCount: number;
  } | null>(null);

  const isOwner = callerRole === "owner";

  // Buscar usuários com emails (via edge function para owner)
  const { data: usersWithEmails } = useQuery({
    queryKey: ["admin-users-emails"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-users-with-emails");
      if (error) {
        console.error("Erro ao buscar emails:", error);
        return {};
      }
      return (data?.emails || {}) as Record<string, string>;
    },
    enabled: isOwner,
  });

  // Buscar usuários com seus roles e métricas financeiras
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users-with-metrics"],
    queryFn: async () => {
      // Buscar roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Buscar profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name");

      if (profilesError) throw profilesError;

      // Buscar métricas financeiras agregadas por vendor_id
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("vendor_id, amount_cents, platform_fee_cents, status");

      if (ordersError) throw ordersError;

      // Agregar métricas por usuário
      const metricsMap = new Map<string, { gmv: number; fees: number; count: number }>();
      
      ordersData?.forEach((order) => {
        if (order.status === "paid") {
          const current = metricsMap.get(order.vendor_id) || { gmv: 0, fees: 0, count: 0 };
          metricsMap.set(order.vendor_id, {
            gmv: current.gmv + (order.amount_cents || 0),
            fees: current.fees + (order.platform_fee_cents || 0),
            count: current.count + 1,
          });
        }
      });

      // Combinar dados
      const usersWithRoles: UserWithRole[] = rolesData.map((roleRow) => {
        const profile = profilesData.find((p) => p.id === roleRow.user_id);
        const metrics = metricsMap.get(roleRow.user_id) || { gmv: 0, fees: 0, count: 0 };
        return {
          user_id: roleRow.user_id,
          role: roleRow.role as AppRole,
          profile: profile ? { name: profile.name || "Sem nome" } : null,
          total_gmv: metrics.gmv,
          total_fees: metrics.fees,
          orders_count: metrics.count,
        };
      });

      return usersWithRoles;
    },
  });

  // Filtrar usuários baseado no role do caller
  const visibleUsers = useMemo(() => {
    if (!users) return [];
    
    // Sempre ocultar owners da lista
    let filtered = users.filter((u) => u.role !== "owner");
    
    // Admin só vê sellers e users (não vê outros admins)
    if (callerRole === "admin") {
      filtered = filtered.filter((u) => u.role === "seller" || u.role === "user");
    }

    // Adicionar emails se for owner
    if (isOwner && usersWithEmails) {
      filtered = filtered.map((u) => ({
        ...u,
        email: usersWithEmails[u.user_id] || undefined,
      }));
    }

    return filtered;
  }, [users, callerRole, isOwner, usersWithEmails]);

  // Mutation para alterar role
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { data, error } = await supabase.functions.invoke("manage-user-role", {
        body: { targetUserId: userId, newRole },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-role-stats"] });
      toast.success("Role atualizado com sucesso!");
      setConfirmDialog(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar role");
      setConfirmDialog(null);
    },
  });

  // Filtrar usuários pela busca
  const filteredUsers = useMemo(() => {
    let result = visibleUsers.filter((user) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        user.profile?.name?.toLowerCase().includes(searchLower) ||
        user.user_id.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    });

    // Ordenar
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = (a.profile?.name || "").localeCompare(b.profile?.name || "");
          break;
        case "gmv":
          comparison = a.total_gmv - b.total_gmv;
          break;
        case "orders":
          comparison = a.orders_count - b.orders_count;
          break;
      }
      return sortDirection === "desc" ? -comparison : comparison;
    });

    return result;
  }, [visibleUsers, search, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Obter roles disponíveis para seleção
  const getAvailableRoles = (currentRole: AppRole): AppRole[] => {
    // Owner: pode promover para seller, user, admin (NUNCA owner)
    if (callerRole === "owner") {
      const ownerOptions: AppRole[] = ["seller", "user", "admin"];
      return ownerOptions.filter((r) => r !== currentRole);
    }
    
    // Admin: pode apenas alternar entre seller e user
    if (callerRole === "admin") {
      const adminOptions: AppRole[] = ["seller", "user"];
      return adminOptions.filter((r) => r !== currentRole);
    }
    
    return [];
  };

  const handleRoleChange = (userId: string, userName: string, currentRole: AppRole, newRole: string) => {
    setConfirmDialog({
      open: true,
      userId,
      userName,
      currentRole,
      newRole: newRole as AppRole,
    });
  };

  const confirmRoleChange = () => {
    if (!confirmDialog) return;
    changeRoleMutation.mutate({
      userId: confirmDialog.userId,
      newRole: confirmDialog.newRole,
    });
  };

  if (!canManageUsers && callerRole !== "admin") {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Você não tem permissão para gerenciar usuários.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Gerenciamento de Usuários
        </CardTitle>
        <CardDescription>
          {isOwner 
            ? "Visualize e gerencie os roles de todos os usuários."
            : "Visualize e gerencie os roles de sellers e usuários."
          }
          {callerRole === "admin" && (
            <span className="block mt-1 text-amber-500">
              Como admin, você pode alternar entre seller ↔ user apenas.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isOwner ? "Buscar por nome, email ou ID..." : "Buscar por nome ou ID..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabela */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => toggleSort("name")}
                  >
                    Usuário
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                {isOwner && <TableHead>Email</TableHead>}
                <TableHead>Role</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => toggleSort("gmv")}
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
                    onClick={() => toggleSort("orders")}
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
                  <TableCell colSpan={isOwner ? 8 : 6} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isOwner ? 8 : 6} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
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
                      <TableCell>
                        <Badge variant="outline" className={ROLE_COLORS[user.role]}>
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={user.total_gmv > 0 ? "text-emerald-500 font-medium" : "text-muted-foreground"}>
                          {formatCentsToBRL(user.total_gmv)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={user.total_fees > 0 ? "text-blue-500 font-medium" : "text-muted-foreground"}>
                          {formatCentsToBRL(user.total_fees)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={user.orders_count > 0 ? "font-medium" : "text-muted-foreground"}>
                          {user.orders_count}
                        </span>
                      </TableCell>
                      <TableCell>
                        {availableRoles.length > 0 ? (
                          <Select
                            onValueChange={(value) =>
                              handleRoleChange(
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
                            onClick={() => setSelectedUser({
                              userId: user.user_id,
                              userName: user.profile?.name || "Sem nome",
                              userEmail: user.email,
                              userRole: user.role,
                              totalGmv: user.total_gmv,
                              totalFees: user.total_fees,
                              ordersCount: user.orders_count,
                            })}
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
      </CardContent>

      {/* Dialog de Confirmação */}
      <AlertDialog
        open={confirmDialog?.open}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de role</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a alterar o role de{" "}
              <strong>{confirmDialog?.userName}</strong> de{" "}
              <Badge variant="outline" className={ROLE_COLORS[confirmDialog?.currentRole || "seller"]}>
                {ROLE_LABELS[confirmDialog?.currentRole || "seller"]}
              </Badge>{" "}
              para{" "}
              <Badge variant="outline" className={ROLE_COLORS[confirmDialog?.newRole || "seller"]}>
                {ROLE_LABELS[confirmDialog?.newRole || "seller"]}
              </Badge>
              .
              <br />
              <br />
              Esta ação será registrada no log de segurança.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRoleChange}
              disabled={changeRoleMutation.isPending}
            >
              {changeRoleMutation.isPending ? "Alterando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Detalhes do Usuário */}
      {selectedUser && (
        <UserDetailSheet
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          userId={selectedUser.userId}
          userName={selectedUser.userName}
          userEmail={selectedUser.userEmail}
          userRole={selectedUser.userRole}
          totalGmv={selectedUser.totalGmv}
          totalFees={selectedUser.totalFees}
          ordersCount={selectedUser.ordersCount}
        />
      )}
    </Card>
  );
}
