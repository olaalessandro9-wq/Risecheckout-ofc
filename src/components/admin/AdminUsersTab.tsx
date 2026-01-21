/**
 * AdminUsersTab - Aba de gerenciamento de usuários
 * 
 * RISE Protocol V3 - XState Unified Architecture
 * 
 * Consome estado do AdminContext (Single Source of Truth)
 * 
 * Regras:
 * - Owner vê todos exceto ele mesmo, com emails
 * - Admin vê apenas sellers e users, sem emails
 * 
 * @version 3.0.0
 */

import { useMemo, useEffect } from "react";
import { usePermissions, AppRole } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Shield, UserCog } from "lucide-react";

import { 
  UsersTable, 
  RoleChangeDialog 
} from "@/modules/admin/components";
import { 
  useAdminFilters, 
  useAdminSort, 
  createUserComparator 
} from "@/modules/admin/hooks";
import { useAdmin } from "@/modules/admin/context";
import type { UserWithRole, SelectedUserData } from "@/modules/admin/types/admin.types";

import { UserDetailSheet } from "./UserDetailSheet";

export function AdminUsersTab() {
  const { role: callerRole, canManageUsers } = usePermissions();
  const { 
    context,
    isUsersLoading,
    loadUsers,
    selectUser,
    deselectUser,
    setUsersSearch,
    openRoleChange,
    confirmRoleChange,
    cancelRoleChange,
  } = useAdmin();

  const isOwner = callerRole === "owner";
  const usersContext = context.users;

  // Load users on mount if not loaded
  useEffect(() => {
    if (usersContext.items.length === 0 && !isUsersLoading && !usersContext.error) {
      loadUsers();
    }
  }, [usersContext.items.length, isUsersLoading, usersContext.error, loadUsers]);

  // Filter users based on caller role
  const visibleUsers = useMemo(() => {
    const users = usersContext.items;
    if (!users.length) return [];
    
    let filtered = users.filter((u) => u.role !== "owner");
    
    if (callerRole === "admin") {
      filtered = filtered.filter((u) => u.role === "seller" || u.role === "user");
    }

    return filtered;
  }, [usersContext.items, callerRole]);

  // Use modular hooks for filtering and sorting
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

  // Sync search term with context
  useEffect(() => {
    if (searchTerm !== usersContext.searchTerm) {
      setUsersSearch(searchTerm);
    }
  }, [searchTerm, usersContext.searchTerm, setUsersSearch]);

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
    openRoleChange({
      open: true,
      userId,
      userName,
      currentRole,
      newRole: newRole as AppRole,
    });
  };

  const handleConfirmRoleChange = async () => {
    try {
      await confirmRoleChange();
      toast.success("Role atualizado com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar role");
    }
  };

  const handleSelectUser = (user: UserWithRole) => {
    const userData: SelectedUserData = {
      userId: user.user_id,
      userName: user.profile?.name || "Sem nome",
      userEmail: user.email,
      userRole: user.role,
      totalGmv: user.total_gmv,
      totalFees: user.total_fees,
      ordersCount: user.orders_count,
    };
    selectUser(userData);
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
          isLoading={isUsersLoading}
          isOwner={isOwner}
          callerRole={callerRole}
          onToggleSort={toggleSort}
          onRoleChange={handleRoleChange}
          onViewDetails={handleSelectUser}
          getAvailableRoles={getAvailableRoles}
        />
      </CardContent>

      {/* Role Change Dialog - Pure Component */}
      {usersContext.roleChangeDialog && (
        <RoleChangeDialog
          open={usersContext.roleChangeDialog.open}
          userName={usersContext.roleChangeDialog.userName}
          currentRole={usersContext.roleChangeDialog.currentRole}
          newRole={usersContext.roleChangeDialog.newRole}
          isPending={usersContext.isChangingRole || false}
          onConfirm={handleConfirmRoleChange}
          onCancel={cancelRoleChange}
        />
      )}

      {/* User Detail Sheet */}
      {usersContext.selectedUser && (
        <UserDetailSheet
          open={!!usersContext.selectedUser}
          onOpenChange={(open) => !open && deselectUser()}
          userId={usersContext.selectedUser.userId}
          userName={usersContext.selectedUser.userName}
          userEmail={usersContext.selectedUser.userEmail}
          userRole={usersContext.selectedUser.userRole}
          totalGmv={usersContext.selectedUser.totalGmv}
          totalFees={usersContext.selectedUser.totalFees}
          ordersCount={usersContext.selectedUser.ordersCount}
        />
      )}
    </Card>
  );
}
