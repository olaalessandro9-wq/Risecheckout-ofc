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

import { useState, useEffect } from "react";
import { CouponsTable } from "@/components/products/CouponsTable";
import { CouponDialog, type CouponFormData, type CouponSaveResult } from "@/components/products/CouponDialog";
import { useProductContext } from "../context/ProductContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useConfirmDelete } from "@/components/common/ConfirmDelete";

// Tipo Coupon para a tabela
interface Coupon {
  id: string;
  code: string;
  discount: number;
  discountType: "percentage" | "fixed";
  startDate: Date;
  endDate: Date;
  applyToOrderBumps: boolean;
  usageCount: number;
}

export function CuponsTab() {
  const { product } = useProductContext();
  const { confirm, Bridge } = useConfirmDelete();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponFormData | null>(null);

  // Carregar cupons do produto
  useEffect(() => {
    if (product?.id) {
      loadCoupons();
    }
  }, [product?.id]);

  const loadCoupons = async () => {
    if (!product?.id) return;

    try {
      setLoading(true);

      // Buscar cupons via Edge Function
      const { data, error } = await supabase.functions.invoke('coupon-management', {
        body: {
          action: 'list',
          productId: product.id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Transformar dados para o formato da tabela
      const transformedCoupons: Coupon[] = (data?.coupons || []).map((c: any) => ({
        id: c.id,
        code: c.code || "",
        discount: c.discount_value || 0,
        discountType: (c.discount_type as "percentage" | "fixed") || "percentage",
        startDate: c.start_date ? new Date(c.start_date) : new Date(),
        endDate: c.expires_at ? new Date(c.expires_at) : new Date(),
        applyToOrderBumps: c.apply_to_order_bumps ?? true,
        usageCount: c.uses_count || 0,
      }));

      setCoupons(transformedCoupons);
    } catch (error) {
      console.error("Error loading coupons:", error);
      toast.error("Não foi possível carregar os cupons");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoupon = () => {
    setEditingCoupon(null);
    setDialogOpen(true);
  };

  const handleEditCoupon = async (coupon: Coupon) => {
    // Buscar dados completos do cupom via supabase (apenas leitura)
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("id", coupon.id)
        .single();

      if (error) throw error;

      const formData: CouponFormData = {
        id: data.id,
        name: data.name || data.code,
        code: data.code,
        description: data.description,
        discountType: data.discount_type as "percentage" | "fixed",
        discountValue: data.discount_value,
        hasExpiration: !!data.expires_at,
        startDate: data.start_date ? new Date(data.start_date) : undefined,
        endDate: data.expires_at ? new Date(data.expires_at) : undefined,
        maxUses: data.max_uses || 0,
        maxUsesPerCustomer: data.max_uses_per_customer || 0,
        applyToOrderBumps: data.apply_to_order_bumps ?? true,
        usageCount: data.uses_count || 0,
      };

      setEditingCoupon(formData);
      setDialogOpen(true);
    } catch (error) {
      console.error("Error loading coupon details:", error);
      toast.error("Não foi possível carregar os detalhes do cupom");
    }
  };

  const handleSaveCoupon = async (couponData: CouponFormData): Promise<CouponSaveResult> => {
    if (!product?.id) return { success: false, error: "Produto não encontrado" };

    try {
      const action = couponData.id ? 'update' : 'create';
      
      const { data, error } = await supabase.functions.invoke('coupon-management', {
        body: {
          action,
          productId: product.id,
          couponId: couponData.id,
          coupon: {
            name: couponData.name,
            code: couponData.code,
            description: couponData.description,
            discountType: couponData.discountType,
            discountValue: couponData.discountValue,
            startDate: couponData.startDate?.toISOString(),
            endDate: couponData.hasExpiration && couponData.endDate ? couponData.endDate.toISOString() : null,
            maxUses: couponData.maxUses || null,
            maxUsesPerCustomer: couponData.maxUsesPerCustomer || null,
            applyToOrderBumps: couponData.applyToOrderBumps,
          },
        },
      });

      if (error) throw error;
      
      if (data?.error) {
        return { 
          success: false, 
          error: data.error,
          field: data.field || undefined,
        };
      }

      // Recarregar lista
      await loadCoupons();
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    await confirm({
      resourceType: "Cupom",
      resourceName: coupons.find(c => c.id === id)?.code || "",
      onConfirm: async () => {
        try {
          const { data, error } = await supabase.functions.invoke('coupon-management', {
            body: {
              action: 'delete',
              productId: product?.id,
              couponId: id,
            },
          });

          if (error) throw error;
          if (data?.error) throw new Error(data.error);

          await loadCoupons();
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

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando cupons...</p>
          </div>
        ) : (
          <CouponsTable
            coupons={coupons}
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
