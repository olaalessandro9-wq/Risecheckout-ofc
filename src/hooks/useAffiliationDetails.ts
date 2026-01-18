import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface AffiliationProduct {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  marketplace_description: string | null;
  marketplace_rules: string | null;
  marketplace_category: string | null;
  user_id: string | null;
  affiliate_settings: {
    enabled?: boolean;
    defaultRate?: number;
    cookieDuration?: number;
    attributionModel?: string;
    requireApproval?: boolean;
    commissionOnOrderBump?: boolean;
    commissionOnUpsell?: boolean;
    supportEmail?: string;
  } | null;
}

export interface AffiliationOffer {
  id: string;
  name: string;
  price: number;
  status: string;
  is_default: boolean | null;
  payment_link_slug: string | null; // Link único por oferta
}

export interface AffiliationCheckout {
  id: string;
  slug: string | null;
  payment_link_slug: string | null;
  is_default: boolean;
  status: string | null;
}

export interface ProducerProfile {
  id: string;
  name: string;
}

export interface AffiliatePixel {
  id: string;
  affiliate_id: string;
  platform: "facebook" | "google_ads" | "tiktok" | "kwai";
  pixel_id: string;
  domain: string | null;
  fire_on_pix: boolean;
  fire_on_boleto: boolean;
  fire_on_card: boolean;
  custom_value_pix: number;
  custom_value_boleto: number;
  custom_value_card: number;
  enabled: boolean;
}

export interface AffiliationDetails {
  id: string;
  affiliate_code: string;
  commission_rate: number;
  status: string;
  total_sales_count: number;
  total_sales_amount: number;
  created_at: string;
  product: AffiliationProduct | null;
  offers: AffiliationOffer[];
  checkouts: AffiliationCheckout[];
  producer: ProducerProfile | null;
  pixels: AffiliatePixel[];
  // Gateway selection (which gateways the affiliate chose)
  pix_gateway: string | null;
  credit_card_gateway: string | null;
  // gateway_credentials REMOVED - RISE V3 Solution D
  // Affiliates inherit credentials from their own profile
  // Configurações permitidas pelo owner
  allowed_gateways: {
    pix_allowed: string[];
    credit_card_allowed: string[];
    require_gateway_connection: boolean;
  };
}

export interface OtherProducerProduct {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  commission_percentage: number | null;
}

interface UseAffiliationDetailsResult {
  affiliation: AffiliationDetails | null;
  otherProducts: OtherProducerProduct[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAffiliationDetails(affiliationId: string | undefined): UseAffiliationDetailsResult {
  const [affiliation, setAffiliation] = useState<AffiliationDetails | null>(null);
  const [otherProducts, setOtherProducts] = useState<OtherProducerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAffiliationDetails = async () => {
    if (!affiliationId) {
      setIsLoading(false);
      setError("ID da afiliação não fornecido");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call Edge Function to get affiliation details (bypasses RLS)
      const { data, error: invokeError } = await api.call<{ 
        error?: string; 
        affiliation?: {
          id: string;
          affiliate_code: string;
          commission_rate: number;
          status: string;
          total_sales_count?: number;
          total_sales_amount?: number;
          created_at: string;
          product?: AffiliationProduct;
          offers?: AffiliationOffer[];
          checkouts?: AffiliationCheckout[];
          producer?: ProducerProfile;
          pixels?: AffiliatePixel[];
          pix_gateway?: string;
          credit_card_gateway?: string;
          // gateway_credentials removed - RISE V3 Solution D
          allowed_gateways?: {
            pix_allowed: string[];
            credit_card_allowed: string[];
            require_gateway_connection: boolean;
          };
        };
        otherProducts?: OtherProducerProduct[];
      }>("get-affiliation-details", { affiliation_id: affiliationId });

      if (invokeError) {
        console.error("Erro ao invocar get-affiliation-details:", invokeError);
        throw new Error(invokeError.message || "Erro ao buscar detalhes da afiliação");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.affiliation) {
        throw new Error("Afiliação não encontrada");
      }

      // Set affiliation data from Edge Function response
      setAffiliation({
        id: data.affiliation.id,
        affiliate_code: data.affiliation.affiliate_code,
        commission_rate: data.affiliation.commission_rate,
        status: data.affiliation.status,
        total_sales_count: data.affiliation.total_sales_count || 0,
        total_sales_amount: data.affiliation.total_sales_amount || 0,
        created_at: data.affiliation.created_at,
        product: data.affiliation.product as AffiliationProduct,
        offers: data.affiliation.offers as AffiliationOffer[],
        checkouts: data.affiliation.checkouts as AffiliationCheckout[],
        producer: data.affiliation.producer as ProducerProfile | null,
        pixels: data.affiliation.pixels as AffiliatePixel[],
        pix_gateway: data.affiliation.pix_gateway,
        credit_card_gateway: data.affiliation.credit_card_gateway,
        // gateway_credentials removed - RISE V3 Solution D
        allowed_gateways: data.affiliation.allowed_gateways,
      });

      // Set other products from same producer
      setOtherProducts(data.otherProducts || []);

    } catch (err: unknown) {
      console.error("Erro ao buscar detalhes da afiliação:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar detalhes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliationDetails();
  }, [affiliationId]);

  return {
    affiliation,
    otherProducts,
    isLoading,
    error,
    refetch: fetchAffiliationDetails,
  };
}
