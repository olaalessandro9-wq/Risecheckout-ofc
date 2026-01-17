/**
 * Hook para carregar dados do produto e ofertas para página de afiliação
 * 
 * MIGRATED: Uses affiliation-public Edge Function
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface AffiliationProductResponse {
  success?: boolean;
  error?: string;
  data?: {
    product: AffiliationProduct;
    offers: Offer[];
  };
}

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
        const { data, error: invokeError } = await api.publicCall<AffiliationProductResponse>("affiliation-public", {
          action: "all",
          productId,
        });

        if (invokeError) {
          throw new Error(String(invokeError));
        }

        if (!data?.success) {
          throw new Error(data?.error || "Erro ao carregar dados");
        }

        setProduct(data.data!.product);
        setOffers(data.data!.offers || []);
      } catch (err) {
        console.error("Erro ao carregar produto:", err);
        const message = err instanceof Error ? err.message : "Produto não encontrado ou programa de afiliados desativado.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [productId]);

  return { product, offers, isLoading, error };
}
