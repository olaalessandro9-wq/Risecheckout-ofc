import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AffiliateSettings {
  enabled: boolean;
  defaultRate: number;
  cookieDuration: number;
  allowUpsells?: boolean;
  commissionOnOrderBump?: boolean;
  commissionOnUpsell?: boolean;
  supportEmail?: string;
  publicDescription?: string;
  attributionModel: string;
  requireApproval: boolean;
}

export interface AffiliationProduct {
  id: string;
  name: string;
  image_url?: string;
  affiliate_settings: AffiliateSettings;
}

export interface Offer {
  id: string;
  name: string;
  price: number;
}

interface UseAffiliationProductResult {
  product: AffiliationProduct | null;
  offers: Offer[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para carregar dados do produto e ofertas para página de afiliação
 */
export function useAffiliationProduct(productId: string | undefined): UseAffiliationProductResult {
  const [product, setProduct] = useState<AffiliationProduct | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setError("ID do produto não informado");
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        // Carregar produto
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("id, name, image_url, affiliate_settings")
          .eq("id", productId)
          .single();

        if (productError) throw productError;

        const settings = productData.affiliate_settings as unknown as AffiliateSettings | null;
        if (!settings?.enabled) {
          setError("Este produto não possui programa de afiliados ativo.");
          setIsLoading(false);
          return;
        }

        setProduct({ ...productData, affiliate_settings: settings });

        // Carregar ofertas
        const { data: offersData, error: offersError } = await supabase
          .from("offers")
          .select("id, name, price")
          .eq("product_id", productId)
          .eq("status", "active");

        if (offersError) throw offersError;

        // Converter price de centavos para reais
        const parsedOffers = (offersData || []).map(offer => ({
          ...offer,
          price: (parseFloat(String(offer.price)) || 0) / 100,
        }));

        setOffers(parsedOffers);
      } catch (err) {
        console.error("Erro ao carregar produto:", err);
        setError("Produto não encontrado ou programa de afiliados desativado.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [productId]);

  return { product, offers, isLoading, error };
}
