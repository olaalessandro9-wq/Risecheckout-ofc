/**
 * useProductCore - Gerenciamento do Produto Principal
 * 
 * Responsável por:
 * - Estado do produto (product)
 * - Carregamento inicial
 * - Atualização local
 * - Salvamento no banco
 * - Deleção
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { deleteProductCascade } from "@/lib/products/deleteProduct";
import type { 
  ProductData, 
  UpsellSettings, 
  AffiliateSettings 
} from "../../types/product.types";

interface UseProductCoreOptions {
  productId: string | null;
  userId: string | undefined;
  onUnsavedChange: () => void;
  // Callbacks para setar settings após refresh (injeção de dependência)
  onUpsellSettingsLoaded?: (settings: UpsellSettings) => void;
  onAffiliateSettingsLoaded?: (settings: AffiliateSettings) => void;
}

interface UseProductCoreReturn {
  product: ProductData | null;
  setProduct: React.Dispatch<React.SetStateAction<ProductData | null>>;
  refreshProduct: () => Promise<void>;
  updateProduct: (field: keyof ProductData, value: any) => void;
  updateProductBulk: (data: Partial<ProductData>) => void;
  saveProduct: () => Promise<void>;
  deleteProduct: () => Promise<boolean>;
}

export function useProductCore({
  productId,
  userId,
  onUnsavedChange,
  onUpsellSettingsLoaded,
  onAffiliateSettingsLoaded,
}: UseProductCoreOptions): UseProductCoreReturn {
  const [product, setProduct] = useState<ProductData | null>(null);

  // ---------------------------------------------------------------------------
  // REFRESH - Carregar do banco + Extrair Settings
  // ---------------------------------------------------------------------------

  const refreshProduct = useCallback(async (): Promise<void> => {
    if (!productId || !userId) return;

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      // Atualizar produto
      setProduct({
        id: data.id,
        name: data.name || "",
        description: data.description || "",
        price: data.price || 0,
        image_url: data.image_url,
        support_name: data.support_name || "",
        support_email: data.support_email || "",
        status: data.status as "active" | "blocked",
        user_id: data.user_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        delivery_url: data.delivery_url,
      });

      // Extrair e notificar upsell_settings
      if (onUpsellSettingsLoaded && data.upsell_settings) {
        const upsell = data.upsell_settings as Record<string, any>;
        onUpsellSettingsLoaded({
          hasCustomThankYouPage: upsell.hasCustomThankYouPage || false,
          customPageUrl: upsell.customPageUrl || "",
          redirectIgnoringOrderBumpFailures: upsell.redirectIgnoringOrderBumpFailures || false,
        });
      }

      // Extrair e notificar affiliate_settings
      if (onAffiliateSettingsLoaded) {
        const affiliate = (data.affiliate_settings as Record<string, any>) || {};
        onAffiliateSettingsLoaded({
          enabled: affiliate.enabled || false,
          defaultRate: affiliate.defaultRate || affiliate.commission || 50,
          requireApproval: affiliate.requireApproval || false,
          commissionOnOrderBump: affiliate.commissionOnOrderBump ?? affiliate.allowUpsells ?? false,
          commissionOnUpsell: affiliate.commissionOnUpsell ?? affiliate.allowUpsells ?? false,
          supportEmail: affiliate.supportEmail || "",
          publicDescription: affiliate.publicDescription || "",
          attributionModel: affiliate.attributionModel || "last_click",
          cookieDuration: affiliate.cookieDuration || 30,
          // ✅ Campos de marketplace dos campos diretos da tabela
          showInMarketplace: data.show_in_marketplace || false,
          marketplaceDescription: data.marketplace_description || "",
          marketplaceCategory: data.marketplace_category || "",
        });
      }
    } catch (error: any) {
      console.error("[useProductCore] Error loading product:", error);
      toast.error("Erro ao carregar produto");
    }
  }, [productId, userId, onUpsellSettingsLoaded, onAffiliateSettingsLoaded]);

  // ---------------------------------------------------------------------------
  // UPDATE LOCAL - Sem salvar no banco
  // ---------------------------------------------------------------------------

  const updateProduct = useCallback(
    (field: keyof ProductData, value: any) => {
      setProduct((prev) => {
        if (!prev) return prev;
        return { ...prev, [field]: value };
      });
      onUnsavedChange();
    },
    [onUnsavedChange]
  );

  const updateProductBulk = useCallback(
    (data: Partial<ProductData>) => {
      setProduct((prev) => {
        if (!prev) return prev;
        return { ...prev, ...data };
      });
      onUnsavedChange();
    },
    [onUnsavedChange]
  );

  // ---------------------------------------------------------------------------
  // SAVE - Salvar no banco
  // ---------------------------------------------------------------------------

  const saveProduct = useCallback(async () => {
    if (!product || !productId || !userId) return;

    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: product.name,
          description: product.description,
          price: product.price,
          image_url: product.image_url,
          support_name: product.support_name,
          support_email: product.support_email,
          status: product.status,
        })
        .eq("id", productId)
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Produto salvo com sucesso");
      await refreshProduct();
    } catch (error: any) {
      console.error("[useProductCore] Error saving product:", error);
      toast.error("Erro ao salvar produto");
      throw error;
    }
  }, [product, productId, userId, refreshProduct]);

  // ---------------------------------------------------------------------------
  // DELETE - Excluir do banco
  // ---------------------------------------------------------------------------

  const deleteProduct = useCallback(async () => {
    if (!productId || !userId) return false;

    try {
      await deleteProductCascade(supabase, productId);
      toast.success("Produto excluído com sucesso");
      return true;
    } catch (error: any) {
      console.error("[useProductCore] Error deleting product:", error);
      toast.error(error.message || "Erro ao excluir produto");
      return false;
    }
  }, [productId, userId]);

  return {
    product,
    setProduct,
    refreshProduct,
    updateProduct,
    updateProductBulk,
    saveProduct,
    deleteProduct,
  };
}
