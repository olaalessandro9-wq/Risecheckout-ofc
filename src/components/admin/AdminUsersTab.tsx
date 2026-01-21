/**
 * AdminUsersTab - Aba de gerenciamento de usuários
 * 
 * RISE Protocol V3 Compliant - Uses modular components from admin module
 * 
 * Regras:
 * - Owner vê todos exceto ele mesmo, com emails
 * - Admin vê apenas sellers e users, sem emails
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePermissions, AppRole } from "@/hooks/usePermissions";
import { createLogger } from "@/lib/logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Shield, UserCog } from "lucide-react";

// Import from admin module
import { 
  UsersTable, 
  RoleChangeDialog 
} from "@/modules/admin/components";
import { 
  useAdminFilters, 
  useAdminSort, 
  createUserComparator 
} from "@/modules/admin/hooks";
import { 
  type UserWithRole,
  type RoleChangeDialog as RoleChangeDialogType,
  type SelectedUserData,
} from "@/modules/admin/types/admin.types";

import { UserDetailSheet } from "./UserDetailSheet";

const log = createLogger("AdminUsersTab");

interface UsersWithEmailsResponse {
  emails?: Record<string, string>;
}

interface AdminUsersResponse {
  error?: string;
  users?: UserWithRole[];
}

interface ManageUserRoleResponse {
  success?: boolean;
  error?: string;
}

export function AdminUsersTab() {
  const { role: callerRole, canManageUsers } = usePermissions();
  const queryClient = useQueryClient();
  
  const [confirmDialog, setConfirmDialog] = useState<RoleChangeDialogType | null>(null);
  const [selectedUser, setSelectedUser] = useState<SelectedUserData | null>(null);

  const isOwner = callerRole === "owner";

  // Fetch user emails (owner only)
  const { data: usersWithEmails } = useQuery({
    queryKey: ["admin-users-emails"],
    queryFn: async () => {
      const { data, error } = await api.call<UsersWithEmailsResponse>("get-users-with-emails", {});
      if (error) {
        log.error("Erro ao buscar emails:", error);
        return {};
      }
      return (data?.emails || {}) as Record<string, string>;
    },
    enabled: isOwner,
  });

  // Fetch users with metrics
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users-with-metrics"],
    queryFn: async () => {
      const { data, error } = await api.call<AdminUsersResponse>("admin-data", {
        action: "users-with-metrics",
      });
      if (error) throw new Error(String(error));
      if (data?.error) throw new Error(data.error);
      return data?.users || [];
    },
  });

  // Filter users based on caller role
  const visibleUsers = useMemo(() => {
    if (!users) return [];
    
    let filtered = users.filter((u) => u.role !== "owner");
    
    if (callerRole === "admin") {
      filtered = filtered.filter((u) => u.role === "seller" || u.role === "user");
    }

    if (isOwner && usersWithEmails) {
      filtered = filtered.map((u) => ({
        ...u,
        email: usersWithEmails[u.user_id] || undefined,
      }));
    }

    return filtered;
  }, [users, callerRole, isOwner, usersWithEmails]);

  // Use modular hooks
  const { filteredItems, searchTerm, setSearchTerm } = useAdminFilters(
    visibleUsers,
    (user) => [
      user.profile?.name || "",
      user.user_id,
      user.role,
      user.email || "",
    ],
    {}
  );

  const { sortedItems, toggleSort } = useAdminSort(
    filteredItems,
    "gmv" as const,
    "desc",
    createUserComparator()
  );

  // Role change mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { data, error } = await api.call<ManageUserRoleResponse>("manage-user-role", {
        targetUserId: userId,
        newRole,
      });
      if (error) throw new Error(String(error));
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

  // Get available roles for selection
  const getAvailableRoles = (currentRole: AppRole): AppRole[] => {
    if (callerRole === "owner") {
      const ownerOptions: AppRole[] = ["seller", "user", "admin"];
      return ownerOptions.filter((r) => r !== currentRole);
    }
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

  const handleSelectUser = (user: UserWithRole) => {
    setSelectedUser({
      userId: user.user_id,
      userName: user.profile?.name || "Sem nome",
      userEmail: user.email,
      userRole: user.role,
      totalGmv: user.total_gmv,
      totalFees: user.total_fees,
      ordersCount: user.orders_count,
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
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isOwner ? "Buscar por nome, email ou ID..." : "Buscar por nome ou ID..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table - Pure Component */}
        <UsersTable
          users={sortedItems}
          isLoading={isLoading}
          isOwner={isOwner}
          callerRole={callerRole}
          onToggleSort={toggleSort}
          onRoleChange={handleRoleChange}
          onViewDetails={handleSelectUser}
          getAvailableRoles={getAvailableRoles}
        />
      </CardContent>

      {/* Role Change Dialog - Pure Component */}
      {confirmDialog && (
        <RoleChangeDialog
          open={confirmDialog.open}
          userName={confirmDialog.userName}
          currentRole={confirmDialog.currentRole}
          newRole={confirmDialog.newRole}
          isPending={changeRoleMutation.isPending}
          onConfirm={confirmRoleChange}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* User Detail Sheet */}
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
