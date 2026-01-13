/**
 * useProductCore - Gerenciamento do Produto Principal
 * 
 * Responsável por:
 * - Estado do produto (product)
 * - Carregamento inicial
 * - Atualização local
 * - Salvamento no banco via Edge Function
 * - Deleção via Edge Function
 * 
 * MIGRADO para Edge Function: product-settings (actions: update-general, smart-delete)
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  updateProduct: (field: keyof ProductData, value: ProductData[keyof ProductData]) => void;
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
  // REFRESH - Carregar do banco + Extrair Settings (READ direto - ok)
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
        external_delivery: data.external_delivery ?? false,
      });

      // Extrair e notificar upsell_settings
      if (onUpsellSettingsLoaded && data.upsell_settings) {
        const upsell = data.upsell_settings as {
          hasCustomThankYouPage?: boolean;
          customPageUrl?: string;
          redirectIgnoringOrderBumpFailures?: boolean;
        };
        onUpsellSettingsLoaded({
          hasCustomThankYouPage: upsell.hasCustomThankYouPage || false,
          customPageUrl: upsell.customPageUrl || "",
          redirectIgnoringOrderBumpFailures: upsell.redirectIgnoringOrderBumpFailures || false,
        });
      }

      // Extrair e notificar affiliate_settings
      if (onAffiliateSettingsLoaded) {
        const affiliate = (data.affiliate_settings as {
          enabled?: boolean;
          defaultRate?: number;
          commission?: number;
          requireApproval?: boolean;
          commissionOnOrderBump?: boolean;
          commissionOnUpsell?: boolean;
          allowUpsells?: boolean;
          supportEmail?: string;
          publicDescription?: string;
          attributionModel?: "last_click" | "first_click";
          cookieDuration?: number;
        }) || {};
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
    } catch (error: unknown) {
      console.error("[useProductCore] Error loading product:", error);
      toast.error("Erro ao carregar produto");
    }
  }, [productId, userId, onUpsellSettingsLoaded, onAffiliateSettingsLoaded]);

  // ---------------------------------------------------------------------------
  // UPDATE LOCAL - Sem salvar no banco
  // ---------------------------------------------------------------------------

  const updateProduct = useCallback(
    (field: keyof ProductData, value: ProductData[keyof ProductData]) => {
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
  // SAVE - Salvar via Edge Function
  // ---------------------------------------------------------------------------

  const saveProduct = useCallback(async () => {
    if (!product || !productId || !userId) return;

    try {
      const sessionToken = localStorage.getItem('producer_session_token');
      
      const { data, error } = await supabase.functions.invoke('product-settings', {
        body: {
          action: 'update-general',
          productId,
          sessionToken,
          data: {
            name: product.name,
            description: product.description,
            price: product.price,
            image_url: product.image_url,
            support_name: product.support_name,
            support_email: product.support_email,
            status: product.status,
            delivery_url: product.external_delivery ? null : (product.delivery_url ?? null),
            external_delivery: product.external_delivery ?? false,
          },
        },
      });

      if (error) {
        console.error("[useProductCore] Edge Function error:", error);
        toast.error("Erro ao salvar produto");
        throw error;
      }

      if (!data?.success) {
        console.error("[useProductCore] API error:", data?.error);
        toast.error(data?.error || "Erro ao salvar produto");
        throw new Error(data?.error || "Erro ao salvar produto");
      }

      toast.success("Produto salvo com sucesso");
      await refreshProduct();
    } catch (error: unknown) {
      console.error("[useProductCore] Error saving product:", error);
      throw error;
    }
  }, [product, productId, userId, refreshProduct]);

  // ---------------------------------------------------------------------------
  // DELETE - Excluir via Edge Function
  // ---------------------------------------------------------------------------

  const deleteProduct = useCallback(async () => {
    if (!productId || !userId) return false;

    try {
      const sessionToken = localStorage.getItem('producer_session_token');
      
      const { data, error } = await supabase.functions.invoke('product-settings', {
        body: {
          action: 'smart-delete',
          productId,
          sessionToken,
        },
      });

      if (error) {
        console.error("[useProductCore] Edge Function error:", error);
        toast.error("Erro ao excluir produto");
        return false;
      }

      if (!data?.success) {
        console.error("[useProductCore] API error:", data?.error);
        toast.error(data?.error || "Erro ao excluir produto");
        return false;
      }

      const deleteType = data.type === 'soft' ? 'arquivado' : 'excluído';
      toast.success(`Produto ${deleteType} com sucesso`);
      return true;
    } catch (error: unknown) {
      console.error("[useProductCore] Error deleting product:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao excluir produto");
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
