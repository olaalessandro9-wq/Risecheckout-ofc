import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
      // Buscar afiliação com produto
      const { data: affiliationData, error: affiliationError } = await supabase
        .from("affiliates")
        .select(`
          id,
          affiliate_code,
          commission_rate,
          status,
          total_sales_count,
          total_sales_amount,
          created_at,
          product_id,
          product:products (
            id,
            name,
            description,
            image_url,
            price,
            marketplace_description,
            marketplace_rules,
            marketplace_category,
            user_id,
            affiliate_settings
          )
        `)
        .eq("id", affiliationId)
        .single();

      if (affiliationError) throw affiliationError;
      if (!affiliationData) throw new Error("Afiliação não encontrada");

      const product = affiliationData.product as unknown as AffiliationProduct;
      const productId = affiliationData.product_id;

      // Buscar ofertas do produto
      const { data: offersData } = await supabase
        .from("offers")
        .select("id, name, price, status, is_default")
        .eq("product_id", productId)
        .eq("status", "active");

      // Buscar checkouts do produto COM payment_link_slug
      const { data: checkoutsData } = await supabase
        .from("checkouts")
        .select(`
          id, 
          slug, 
          is_default, 
          status,
          checkout_links (
            payment_links (
              slug
            )
          )
        `)
        .eq("product_id", productId)
        .eq("status", "active");

      // Mapear checkouts para incluir payment_link_slug
      const checkoutsWithPaymentSlug: AffiliationCheckout[] = (checkoutsData || []).map((c: any) => ({
        id: c.id,
        slug: c.slug,
        payment_link_slug: c.checkout_links?.[0]?.payment_links?.slug || null,
        is_default: c.is_default,
        status: c.status,
      }));

      // Buscar perfil do produtor
      let producer: ProducerProfile | null = null;
      if (product?.user_id) {
        const { data: producerData } = await supabase
          .from("profiles")
          .select("id, name")
          .eq("id", product.user_id)
          .single();
        
        producer = producerData;
      }

      // Buscar pixels do afiliado
      const { data: pixelsData } = await supabase
        .from("affiliate_pixels")
        .select("*")
        .eq("affiliate_id", affiliationId);

      // Buscar outros produtos do mesmo produtor
      if (product?.user_id) {
        const { data: otherProductsData } = await supabase
          .from("marketplace_products")
          .select("id, name, image_url, price, commission_percentage")
          .eq("producer_id", product.user_id)
          .neq("id", productId)
          .limit(6);

        setOtherProducts(otherProductsData || []);
      }

      // Usar commission_rate do afiliado, ou defaultRate do produto como fallback
      const effectiveCommissionRate = 
        affiliationData.commission_rate ?? 
        (product?.affiliate_settings?.defaultRate || 0);

      setAffiliation({
        id: affiliationData.id,
        affiliate_code: affiliationData.affiliate_code,
        commission_rate: effectiveCommissionRate,
        status: affiliationData.status,
        total_sales_count: affiliationData.total_sales_count || 0,
        total_sales_amount: affiliationData.total_sales_amount || 0,
        created_at: affiliationData.created_at,
        product,
        offers: (offersData || []).map(o => ({
          ...o,
          price: o.price / 100 // Converter de centavos para reais
        })),
        checkouts: checkoutsWithPaymentSlug,
        producer,
        pixels: (pixelsData || []) as AffiliatePixel[],
      });
    } catch (err: any) {
      console.error("Erro ao buscar detalhes da afiliação:", err);
      setError(err.message || "Erro ao carregar detalhes");
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
