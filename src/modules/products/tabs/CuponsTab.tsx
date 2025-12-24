/**
 * CuponsTab - Aba de Gerenciamento de Cupons de Desconto
 * 
 * Esta aba gerencia:
 * - Listagem de cupons do produto
 * - Adicionar novo cupom
 * - Editar cupom existente
 * - Deletar cupom
 * - Cupons são específicos por produto
 */

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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

      // Buscar cupons vinculados a este produto
      const { data: couponProducts, error: cpError } = await supabase
        .from("coupon_products")
        .select(`
          coupon_id,
          coupons (
            id,
            name,
            code,
            description,
            discount_type,
            discount_value,
            start_date,
            expires_at,
            max_uses,
            max_uses_per_customer,
            uses_count,
            apply_to_order_bumps,
            active
          )
        `)
        .eq("product_id", product.id);

      if (cpError) throw cpError;

      // Transformar dados para o formato da tabela
      const transformedCoupons: Coupon[] = (couponProducts || [])
        .filter(cp => cp.coupons)
        .map(cp => {
          const c = cp.coupons as any;
          return {
            id: c.id,
            code: c.code || "",
            discount: c.discount_value || 0,
            discountType: (c.discount_type as "percentage" | "fixed") || "percentage",
            startDate: c.start_date ? new Date(c.start_date) : new Date(),
            endDate: c.expires_at ? new Date(c.expires_at) : new Date(),
            applyToOrderBumps: c.apply_to_order_bumps ?? true,
            usageCount: c.uses_count || 0,
          };
        });

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
    // Buscar dados completos do cupom
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
      const normalizedCode = couponData.code.trim().toUpperCase();

      // Buscar cupons existentes neste produto
      const { data: existingCouponProducts, error: checkError } = await supabase
        .from("coupon_products")
        .select(`
          coupon_id,
          coupons!inner (id, code)
        `)
        .eq("product_id", product.id);

      if (checkError) throw checkError;

      // Verificar duplicação de código
      const duplicateExists = existingCouponProducts?.some(cp => {
        const coupon = cp.coupons as { id: string; code: string };
        // Ignora o próprio cupom em caso de edição
        if (couponData.id && coupon.id === couponData.id) return false;
        return coupon.code.toUpperCase() === normalizedCode;
      });

      if (duplicateExists) {
        return { 
          success: false, 
          error: `Já existe um cupom com o código "${couponData.code}" neste produto`,
          field: "code"
        };
      }

      const couponPayload = {
        name: couponData.name,
        code: couponData.code,
        description: couponData.description,
        discount_type: couponData.discountType,
        discount_value: couponData.discountValue,
        start_date: couponData.startDate?.toISOString(),
        expires_at: couponData.hasExpiration && couponData.endDate ? couponData.endDate.toISOString() : null,
        max_uses: couponData.maxUses || null,
        max_uses_per_customer: couponData.maxUsesPerCustomer || null,
        apply_to_order_bumps: couponData.applyToOrderBumps,
        active: true,
      };

      if (couponData.id) {
        // Atualizar cupom existente
        const { error } = await supabase
          .from("coupons")
          .update(couponPayload)
          .eq("id", couponData.id);

        if (error) throw error;
      } else {
        // Criar novo cupom
        const { data: newCoupon, error: couponError } = await supabase
          .from("coupons")
          .insert(couponPayload)
          .select()
          .single();

        if (couponError) throw couponError;

        // Vincular cupom ao produto
        const { error: linkError } = await supabase
          .from("coupon_products")
          .insert({
            coupon_id: newCoupon.id,
            product_id: product.id,
          });

        if (linkError) throw linkError;
      }

      // Recarregar lista
      await loadCoupons();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Erro desconhecido' };
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    await confirm({
      resourceType: "Cupom",
      resourceName: coupons.find(c => c.id === id)?.code || "",
      onConfirm: async () => {
        try {
          // Deletar vínculo produto-cupom
          const { error: linkError } = await supabase
            .from("coupon_products")
            .delete()
            .eq("coupon_id", id)
            .eq("product_id", product?.id);

          if (linkError) throw linkError;

          // Deletar cupom
          const { error: couponError } = await supabase
            .from("coupons")
            .delete()
            .eq("id", id);

          if (couponError) throw couponError;

          await loadCoupons();
        } catch (error: any) {
          throw new Error(`Não foi possível excluir o cupom: ${error?.message || 'Erro desconhecido'}`);
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
