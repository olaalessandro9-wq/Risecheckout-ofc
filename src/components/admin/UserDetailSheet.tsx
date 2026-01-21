/**
 * UserDetailSheet - Modal lateral de detalhes do usuário
 * 
 * RISE Protocol V3 Compliant - Uses modular sub-components from admin module
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePermissions, AppRole } from "@/hooks/usePermissions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User } from "lucide-react";

// Import from admin module
import {
  UserInfo,
  UserFeeSection,
  UserModerationSection,
  UserProductsSection,
  UserMetricsSection,
  UserActionDialog,
} from "@/modules/admin/components";
import type { 
  UserProfile, 
  UserProduct,
  UserActionDialog as UserActionDialogType 
} from "@/modules/admin/types/admin.types";

interface UserDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole: AppRole;
  totalGmv: number;
  totalFees: number;
  ordersCount: number;
}

export function UserDetailSheet({
  open,
  onOpenChange,
  userId,
  userName,
  userEmail,
  userRole,
  totalGmv,
  totalFees,
  ordersCount,
}: UserDetailSheetProps) {
  const { role: callerRole } = usePermissions();
  const queryClient = useQueryClient();
  const isOwner = callerRole === "owner";

  const [customFee, setCustomFee] = useState<string>("");
  const [statusReason, setStatusReason] = useState("");
  const [actionDialog, setActionDialog] = useState<UserActionDialogType | null>(null);

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ["admin-user-profile", userId],
    queryFn: async () => {
      const { data, error } = await api.call<{ error?: string; profile?: UserProfile }>("admin-data", {
        action: "user-profile",
        userId,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data?.profile;
    },
    enabled: open,
  });

  // Fetch user products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["admin-user-products", userId],
    queryFn: async () => {
      const { data, error } = await api.call<{ error?: string; products?: UserProduct[] }>("admin-data", {
        action: "user-products",
        userId,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data?.products || [];
    },
    enabled: open,
  });

  // Action mutation
  const actionMutation = useMutation({
    mutationFn: async (params: {
      action: string;
      userId?: string;
      status?: string;
      reason?: string;
      feePercent?: number | null;
      productId?: string;
    }) => {
      const { data, error } = await api.call<{ error?: string }>("manage-user-status", params);
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-products", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-with-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products-global"] });
      
      const messages: Record<string, string> = {
        updateStatus: "Status do usuário atualizado!",
        updateCustomFee: "Taxa personalizada atualizada!",
        updateProductStatus: "Produto atualizado!",
      };
      toast.success(messages[variables.action] || "Ação executada!");
      
      setActionDialog(null);
      setStatusReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao executar ação");
      setActionDialog(null);
    },
  });

  const handleStatusAction = (type: "suspend" | "ban" | "activate") => {
    setActionDialog({ open: true, type });
  };

  const handleFeeAction = (type: "updateFee" | "resetFee") => {
    setActionDialog({ open: true, type });
  };

  const handleProductAction = (productId: string, productName: string, action: "activate" | "block" | "delete") => {
    setActionDialog({ open: true, type: "productAction", productId, productName, productAction: action });
  };

  const confirmAction = () => {
    if (!actionDialog) return;

    if (actionDialog.type === "suspend" || actionDialog.type === "ban" || actionDialog.type === "activate") {
      const statusMap = { suspend: "suspended", ban: "banned", activate: "active" };
      actionMutation.mutate({
        action: "updateStatus",
        userId,
        status: statusMap[actionDialog.type],
        reason: statusReason || undefined,
      });
    } else if (actionDialog.type === "updateFee") {
      const feeValue = parseFloat(customFee.replace(",", "."));
      if (isNaN(feeValue) || feeValue < 0 || feeValue > 100) {
        toast.error("Taxa inválida. Use um valor entre 0 e 100.");
        return;
      }
      actionMutation.mutate({
        action: "updateCustomFee",
        userId,
        feePercent: feeValue / 100,
      });
    } else if (actionDialog.type === "resetFee") {
      actionMutation.mutate({
        action: "updateCustomFee",
        userId,
        feePercent: null,
      });
    } else if (actionDialog.type === "productAction" && actionDialog.productId) {
      const statusMap = { activate: "active", block: "blocked", delete: "deleted" };
      actionMutation.mutate({
        action: "updateProductStatus",
        productId: actionDialog.productId,
        status: statusMap[actionDialog.productAction!],
      });
    }
  };

  const userStatus = profile?.status || "active";
  const currentFee = profile?.custom_fee_percent;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {userName}
            </SheetTitle>
            <SheetDescription>
              Detalhes e ações de moderação
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* User Info Section */}
            <UserInfo
              userEmail={userEmail}
              userRole={userRole}
              status={userStatus}
              statusReason={profile?.status_reason}
              createdAt={profile?.created_at}
            />

            <Separator />

            {/* Custom Fee Section */}
            {isOwner && (
              <>
                <UserFeeSection
                  currentFee={currentFee}
                  customFeeInput={customFee}
                  onCustomFeeChange={setCustomFee}
                  onApplyFee={() => handleFeeAction("updateFee")}
                  onResetFee={() => handleFeeAction("resetFee")}
                />
                <Separator />
              </>
            )}

            {/* Moderation Actions Section */}
            {isOwner && (
              <>
                <UserModerationSection
                  userStatus={userStatus}
                  onActivate={() => handleStatusAction("activate")}
                  onSuspend={() => handleStatusAction("suspend")}
                  onBan={() => handleStatusAction("ban")}
                />
                <Separator />
              </>
            )}

            {/* Products Section */}
            <UserProductsSection
              products={products || []}
              isLoading={productsLoading}
              isOwner={isOwner}
              onProductAction={handleProductAction}
            />

            <Separator />

            {/* Metrics Section */}
            <UserMetricsSection
              totalGmv={totalGmv}
              totalFees={totalFees}
              ordersCount={ordersCount}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Action Dialog */}
      <UserActionDialog
        dialog={actionDialog}
        userName={userName}
        customFee={customFee}
        statusReason={statusReason}
        onStatusReasonChange={setStatusReason}
        onConfirm={confirmAction}
        onCancel={() => setActionDialog(null)}
      />
    </>
  );
}
