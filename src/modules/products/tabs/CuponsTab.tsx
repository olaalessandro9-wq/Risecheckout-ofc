/**
 * CuponsTab - Aba de Gerenciamento de Cupons de Desconto
 * 
 * MIGRADO: Todas operações via Edge Function coupon-management
 * 
 * Esta aba gerencia:
 * - Listagem de cupons do produto
 * - Adicionar novo cupom
 * - Editar cupom existente
 * - Deletar cupom
 * - Cupons são específicos por produto
 */

import { useState, useMemo } from "react";
import { CouponsTable } from "@/components/products/CouponsTable";
import { CouponDialog, type CouponFormData, type CouponSaveResult } from "@/components/products/coupon-dialog";
import { useProductContext } from "../context/ProductContext";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import { api } from "@/lib/api";
import { useConfirmDelete } from "@/components/common/ConfirmDelete";

const log = createLogger("CuponsTab");

// Tipo Coupon para a tabela (formato do componente CouponsTable)
interface TableCoupon {
  id: string;
  code: string;
  discount: number;
  discountType: "percentage" | "fixed";
  startDate: Date;
  endDate: Date;
  applyToOrderBumps: boolean;
  usageCount: number;
}

/**
 * CuponsTab - Otimizado para usar cache do ProductContext
 * 
 * Dados já vêm carregados via product-full-loader (BFF).
 * Não faz fetch próprio - apenas refreshCoupons após operações CRUD.
 * 
 * @see RISE Protocol V3 - Cache Hit Pattern
 */
export function CuponsTab() {
  const { product, coupons: contextCoupons, refreshCoupons, loading } = useProductContext();
  const { confirm, Bridge } = useConfirmDelete();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponFormData | null>(null);

  // Transformar coupons do contexto para formato da tabela (memoizado)
  const tableCoupons: TableCoupon[] = useMemo(() => {
    return contextCoupons.map((c) => ({
      id: c.id,
      code: c.code,
      discount: c.discount,
      discountType: c.discount_type || "percentage",
      startDate: c.startDate instanceof Date ? c.startDate : new Date(c.startDate || Date.now()),
      endDate: c.endDate instanceof Date ? c.endDate : new Date(c.endDate || Date.now()),
      applyToOrderBumps: c.applyToOrderBumps ?? true,
      usageCount: c.usageCount ?? 0,
    }));
  }, [contextCoupons]);

  const handleAddCoupon = () => {
    setEditingCoupon(null);
    setDialogOpen(true);
  };

  const handleEditCoupon = async (coupon: TableCoupon) => {
    // Buscar dados completos do cupom via Edge Function
    try {
      const { data, error } = await api.call<{ coupon?: Record<string, unknown>; error?: string }>('coupon-read', {
        action: 'get-coupon',
        couponId: coupon.id,
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      
      const couponData = data?.coupon as {
        id: string;
        name?: string;
        code: string;
        description?: string;
        discount_type: string;
        discount_value: number;
        expires_at?: string;
        start_date?: string;
        max_uses?: number;
        max_uses_per_customer?: number;
        apply_to_order_bumps?: boolean;
        uses_count?: number;
      };
      if (!couponData) throw new Error("Cupom não encontrado");

      const formData: CouponFormData = {
        id: couponData.id,
        name: couponData.name || couponData.code,
        code: couponData.code,
        description: couponData.description,
        discountType: couponData.discount_type as "percentage" | "fixed",
        discountValue: couponData.discount_value,
        hasExpiration: !!couponData.expires_at,
        startDate: couponData.start_date ? new Date(couponData.start_date) : undefined,
        endDate: couponData.expires_at ? new Date(couponData.expires_at) : undefined,
        maxUses: couponData.max_uses || 0,
        maxUsesPerCustomer: couponData.max_uses_per_customer || 0,
        applyToOrderBumps: couponData.apply_to_order_bumps ?? true,
        usageCount: couponData.uses_count || 0,
      };

      setEditingCoupon(formData);
      setDialogOpen(true);
    } catch (error: unknown) {
      log.error("Error loading coupon details:", error);
      toast.error("Não foi possível carregar os detalhes do cupom");
    }
  };

  const handleSaveCoupon = async (couponData: CouponFormData): Promise<CouponSaveResult> => {
    if (!product?.id) return { success: false, error: "Produto não encontrado" };

    try {
      const action = couponData.id ? 'update' : 'create';
      
      const { data, error } = await api.call<{ error?: string; field?: string }>('coupon-management', {
        action,
        productId: product.id,
        couponId: couponData.id,
        coupon: {
          name: couponData.name,
          code: couponData.code,
          description: couponData.description,
          discount_type: couponData.discountType,
          discount_value: couponData.discountValue,
          start_date: couponData.startDate?.toISOString() || null,
          expires_at: couponData.hasExpiration && couponData.endDate ? couponData.endDate.toISOString() : null,
          max_uses: couponData.maxUses || null,
          max_uses_per_customer: couponData.maxUsesPerCustomer || null,
          apply_to_order_bumps: couponData.applyToOrderBumps ?? true,
          active: true,
        },
      });

      if (error) throw new Error(error.message);
      
      if (data?.error) {
        return { 
          success: false, 
          error: data.error,
          field: data.field || undefined,
        };
      }

      // Atualizar via contexto (invalidação do cache React Query)
      await refreshCoupons();
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    await confirm({
      resourceType: "Cupom",
      resourceName: tableCoupons.find(c => c.id === id)?.code || "",
      onConfirm: async () => {
        try {
          const { data, error } = await api.call<{ error?: string }>('coupon-management', {
            action: 'delete',
            productId: product?.id,
            couponId: id,
          });

          if (error) throw new Error(error.message);
          if (data?.error) throw new Error(data.error);

          // Atualizar via contexto (invalidação do cache React Query)
          await refreshCoupons();
        } catch (error: unknown) {
          throw new Error(`Não foi possível excluir o cupom: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      },
    });
  };

  if (!product?.id) {
    return (
      <div className="bg-card border border-border rounded-lg p-8">
        <p className="text-muted-foreground">Carregando cupons...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-8 space-y-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Cupons</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Crie cupons de desconto para seus produtos
          </p>
        </div>

        {loading && tableCoupons.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-5 h-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent mx-auto mb-2" />
            <p className="text-muted-foreground">Carregando cupons...</p>
          </div>
        ) : (
          <CouponsTable
            coupons={tableCoupons}
            onAdd={handleAddCoupon}
            onEdit={handleEditCoupon}
            onDelete={handleDeleteCoupon}
          />
        )}
      </div>

      <CouponDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveCoupon}
        coupon={editingCoupon}
      />
      
      {/* Modal de confirmação de deleção */}
      <Bridge />
    </>
  );
}
