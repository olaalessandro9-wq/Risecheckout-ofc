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
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { 
  ProductData, 
  UpsellSettings, 
  AffiliateSettings 
} from "../../types/product.types";

interface UseProductCoreOptions {
  productId: string | null;
  userId: string | undefined;
}

interface UseProductCoreReturn {
  product: ProductData | null;
  upsellSettings: UpsellSettings | null;
  affiliateSettings: AffiliateSettings | null;
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
}: UseProductCoreOptions): UseProductCoreReturn {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [upsellSettings, setUpsellSettings] = useState<UpsellSettings | null>(null);
  const [affiliateSettings, setAffiliateSettings] = useState<AffiliateSettings | null>(null);

  // ---------------------------------------------------------------------------
  // REFRESH - Carregar via Edge Function + Extrair Settings
  // MIGRADO: Uses api.call instead of supabase.functions.invoke
  // ---------------------------------------------------------------------------

  const refreshProduct = useCallback(async (): Promise<void> => {
    if (!productId || !userId) return;

    try {
      const { data: response, error } = await api.call<{
        product?: {
          id: string;
          name: string;
          description: string;
          price: number;
          image_url: string | null;
          support_name: string;
          support_email: string;
          status: string;
          user_id: string;
          created_at: string;
          updated_at: string;
          delivery_url: string | null;
          external_delivery: boolean;
          upsell_settings?: Record<string, unknown>;
          affiliate_settings?: Record<string, unknown>;
          show_in_marketplace?: boolean;
          marketplace_description?: string;
          marketplace_category?: string;
        };
        error?: string;
      }>('products-crud', {
        action: 'get',
        productId,
      });

      if (error) throw error;
      if (response?.error) throw new Error(response.error);
      
      const data = response?.product;
      if (!data) throw new Error("Produto não encontrado");

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

      // Extrair upsell_settings como estado (elimina race condition)
      const upsell = (data.upsell_settings as {
        hasCustomThankYouPage?: boolean;
        customPageUrl?: string;
        redirectIgnoringOrderBumpFailures?: boolean;
      }) || {};
      setUpsellSettings({
        hasCustomThankYouPage: upsell.hasCustomThankYouPage || false,
        customPageUrl: upsell.customPageUrl || "",
        redirectIgnoringOrderBumpFailures: upsell.redirectIgnoringOrderBumpFailures || false,
      });

      // Extrair affiliate_settings como estado (elimina race condition)
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
      setAffiliateSettings({
        enabled: affiliate.enabled || false,
        defaultRate: affiliate.defaultRate || affiliate.commission || 50,
        requireApproval: affiliate.requireApproval || false,
        commissionOnOrderBump: affiliate.commissionOnOrderBump ?? affiliate.allowUpsells ?? false,
        commissionOnUpsell: affiliate.commissionOnUpsell ?? affiliate.allowUpsells ?? false,
        supportEmail: affiliate.supportEmail || "",
        publicDescription: affiliate.publicDescription || "",
        attributionModel: affiliate.attributionModel || "last_click",
        cookieDuration: affiliate.cookieDuration || 30,
        showInMarketplace: data.show_in_marketplace || false,
        marketplaceDescription: data.marketplace_description || "",
        marketplaceCategory: data.marketplace_category || "",
      });
    } catch (error: unknown) {
      console.error("[useProductCore] Error loading product:", error);
      toast.error("Erro ao carregar produto");
    }
  }, [productId, userId]);

  // ---------------------------------------------------------------------------
  // UPDATE LOCAL - Sem salvar no banco
  // ---------------------------------------------------------------------------

  const updateProduct = useCallback(
    (field: keyof ProductData, value: ProductData[keyof ProductData]) => {
      setProduct((prev) => {
        if (!prev) return prev;
        return { ...prev, [field]: value };
      });
    },
    []
  );

  const updateProductBulk = useCallback(
    (data: Partial<ProductData>) => {
      setProduct((prev) => {
        if (!prev) return prev;
        return { ...prev, ...data };
      });
    },
    []
  );

  // ---------------------------------------------------------------------------
  // SAVE - Salvar via Edge Function
  // ---------------------------------------------------------------------------

  const saveProduct = useCallback(async () => {
    if (!product || !productId || !userId) return;

    try {
      const { data, error } = await api.call<{ success?: boolean; error?: string }>('product-settings', {
        action: 'update-general',
        productId,
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

      // NOTA: Toast removido - quem chama saveProduct decide se mostra toast
      // Isso evita toasts duplicados (RISE PROTOCOL V3 - Fase 4)
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
      const { data, error } = await api.call<{ success?: boolean; error?: string; type?: string }>('product-settings', {
        action: 'smart-delete',
        productId,
      });

      if (error) {
        console.error("[useProductCore] Edge Function error:", error);
        // Sem toast - ConfirmDeleteDialog gerencia as mensagens
        return false;
      }

      if (!data?.success) {
        console.error("[useProductCore] API error:", data?.error);
        // Sem toast - ConfirmDeleteDialog gerencia as mensagens
        return false;
      }

      console.log(`[useProductCore] Product deleted successfully: ${data.type}`);
      // Sem toast - ConfirmDeleteDialog gerencia as mensagens
      return true;
    } catch (error: unknown) {
      console.error("[useProductCore] Error deleting product:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao excluir produto");
      return false;
    }
  }, [productId, userId]);

  return {
    product,
    upsellSettings,
    affiliateSettings,
    setProduct,
    refreshProduct,
    updateProduct,
    updateProductBulk,
    saveProduct,
    deleteProduct,
  };
}
