/**
 * UserDetailSheet - Modal lateral de detalhes do usuário
 * 
 * Exibe informações do usuário, produtos, métricas e ações de moderação
 * Apenas Owner pode usar as ações de moderação
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions, AppRole } from "@/hooks/usePermissions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Calendar, 
  Shield,
  Package,
  DollarSign,
  Percent,
  Ban,
  UserX,
  CheckCircle,
  XCircle,
  Trash2,
  RotateCcw
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";

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

interface UserProduct {
  id: string;
  name: string;
  status: string | null;
  price: number;
  total_gmv: number;
  orders_count: number;
}

const formatCentsToBRL = (cents: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
};

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  suspended: "Suspenso",
  banned: "Banido",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  suspended: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  banned: "bg-red-500/10 text-red-500 border-red-500/20",
};

const PRODUCT_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  blocked: "bg-red-500/10 text-red-500 border-red-500/20",
  deleted: "bg-muted text-muted-foreground border-muted",
};

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
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: "suspend" | "ban" | "activate" | "updateFee" | "resetFee" | "productAction";
    productId?: string;
    productName?: string;
    productAction?: "activate" | "block" | "delete";
  } | null>(null);

  // Buscar dados do perfil (status, custom_fee)
  const { data: profile } = useQuery({
    queryKey: ["admin-user-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("status, custom_fee_percent, status_reason, status_changed_at, created_at")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Buscar produtos do usuário com métricas
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["admin-user-products", userId],
    queryFn: async () => {
      // Buscar produtos do usuário
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, status, price")
        .eq("user_id", userId);

      if (productsError) throw productsError;

      // Buscar métricas de pedidos
      const productIds = productsData.map((p) => p.id);
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("product_id, amount_cents, status")
        .in("product_id", productIds);

      if (ordersError) throw ordersError;

      // Agregar métricas por produto
      const metricsMap = new Map<string, { gmv: number; count: number }>();
      ordersData?.forEach((order) => {
        if (order.status === "paid") {
          const current = metricsMap.get(order.product_id) || { gmv: 0, count: 0 };
          metricsMap.set(order.product_id, {
            gmv: current.gmv + (order.amount_cents || 0),
            count: current.count + 1,
          });
        }
      });

      return productsData.map((product) => {
        const metrics = metricsMap.get(product.id) || { gmv: 0, count: 0 };
        return {
          ...product,
          total_gmv: metrics.gmv,
          orders_count: metrics.count,
        } as UserProduct;
      });
    },
    enabled: open,
  });

  // Mutation para ações de moderação
  const actionMutation = useMutation({
    mutationFn: async (params: {
      action: string;
      userId?: string;
      status?: string;
      reason?: string;
      feePercent?: number | null;
      productId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("manage-user-status", {
        body: params,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-products", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-with-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products-global"] });
      
      if (variables.action === "updateStatus") {
        toast.success("Status do usuário atualizado!");
      } else if (variables.action === "updateCustomFee") {
        toast.success("Taxa personalizada atualizada!");
      } else if (variables.action === "updateProductStatus") {
        toast.success("Produto atualizado!");
      }
      
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
  const displayFee = currentFee != null ? `${(currentFee * 100).toFixed(2)}%` : "Padrão (4%)";

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
            {/* Informações do Usuário */}
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
                  {profile?.created_at
                    ? format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })
                    : "-"
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Status:</span>
                <Badge variant="outline" className={STATUS_COLORS[userStatus]}>
                  {STATUS_LABELS[userStatus]}
                </Badge>
              </div>
              {profile?.status_reason && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                  Motivo: {profile.status_reason}
                </div>
              )}
            </div>

            <Separator />

            {/* Taxa Personalizada */}
            {isOwner && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Taxa Personalizada
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{displayFee}</Badge>
                  {currentFee != null && (
                    <span className="text-xs text-muted-foreground">(personalizada)</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Ex: 2.5"
                      value={customFee}
                      onChange={(e) => setCustomFee(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleFeeAction("updateFee")}
                    disabled={!customFee}
                  >
                    Aplicar %
                  </Button>
                  {currentFee != null && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFeeAction("resetFee")}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Ações de Moderação */}
            {isOwner && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Ações de Moderação
                </h3>
                <div className="flex flex-wrap gap-2">
                  {userStatus !== "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-500 border-green-500/30"
                      onClick={() => handleStatusAction("activate")}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Ativar
                    </Button>
                  )}
                  {userStatus !== "suspended" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-amber-500 border-amber-500/30"
                      onClick={() => handleStatusAction("suspend")}
                    >
                      <UserX className="mr-1 h-4 w-4" />
                      Suspender
                    </Button>
                  )}
                  {userStatus !== "banned" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 border-red-500/30"
                      onClick={() => handleStatusAction("ban")}
                    >
                      <Ban className="mr-1 h-4 w-4" />
                      Banir
                    </Button>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Produtos do Usuário */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produtos ({products?.length || 0})
              </h3>
              {productsLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : products && products.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>GMV</TableHead>
                        {isOwner && <TableHead className="w-[80px]">Ações</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={PRODUCT_STATUS_COLORS[product.status || "active"]}
                            >
                              {product.status === "active" ? "Ativo" : 
                               product.status === "blocked" ? "Bloqueado" : "Removido"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={product.total_gmv > 0 ? "text-emerald-500" : "text-muted-foreground"}>
                              {formatCentsToBRL(product.total_gmv)}
                            </span>
                          </TableCell>
                          {isOwner && (
                            <TableCell>
                              <div className="flex gap-1">
                                {product.status !== "active" && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-green-500"
                                    onClick={() => handleProductAction(product.id, product.name, "activate")}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                {product.status !== "blocked" && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-red-500"
                                    onClick={() => handleProductAction(product.id, product.name, "block")}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                {product.status !== "deleted" && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => handleProductAction(product.id, product.name, "delete")}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
              )}
            </div>

            <Separator />

            {/* Métricas */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Métricas Totais
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-semibold text-emerald-500">
                    {formatCentsToBRL(totalGmv)}
                  </p>
                  <p className="text-xs text-muted-foreground">GMV Total</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-semibold text-blue-500">
                    {formatCentsToBRL(totalFees)}
                  </p>
                  <p className="text-xs text-muted-foreground">Taxa Paga</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-semibold">{ordersCount}</p>
                  <p className="text-xs text-muted-foreground">Pedidos</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de Confirmação */}
      <AlertDialog
        open={actionDialog?.open}
        onOpenChange={(open) => !open && setActionDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {actionDialog?.type === "suspend" && (
                  <p>Você está prestes a <strong>suspender</strong> o usuário <strong>{userName}</strong>. O usuário não poderá acessar a plataforma até ser reativado.</p>
                )}
                {actionDialog?.type === "ban" && (
                  <p>Você está prestes a <strong>banir permanentemente</strong> o usuário <strong>{userName}</strong>.</p>
                )}
                {actionDialog?.type === "activate" && (
                  <p>Você está prestes a <strong>reativar</strong> o usuário <strong>{userName}</strong>.</p>
                )}
                {actionDialog?.type === "updateFee" && (
                  <p>Você está prestes a definir uma taxa personalizada de <strong>{customFee}%</strong> para o usuário <strong>{userName}</strong>.</p>
                )}
                {actionDialog?.type === "resetFee" && (
                  <p>Você está prestes a <strong>resetar</strong> a taxa do usuário <strong>{userName}</strong> para o padrão (4%).</p>
                )}
                {actionDialog?.type === "productAction" && (
                  <p>
                    Você está prestes a{" "}
                    <strong>
                      {actionDialog.productAction === "activate" ? "ativar" : 
                       actionDialog.productAction === "block" ? "bloquear" : "remover"}
                    </strong>{" "}
                    o produto <strong>{actionDialog.productName}</strong>.
                  </p>
                )}

                {(actionDialog?.type === "suspend" || actionDialog?.type === "ban") && (
                  <div className="space-y-2">
                    <Label htmlFor="reason">Motivo (opcional)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Descreva o motivo..."
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
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
              onClick={confirmAction}
              className={
                actionDialog?.type === "ban" || 
                (actionDialog?.type === "productAction" && actionDialog?.productAction === "delete")
                  ? "bg-destructive hover:bg-destructive/90"
                  : ""
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
