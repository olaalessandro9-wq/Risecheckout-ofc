/**
 * useProductCheckouts - Gerenciamento de Checkouts e Links
 * 
 * Responsável por:
 * - Checkouts (checkouts)
 * - Links de Pagamento (paymentLinks)
 * 
 * Nota: Apenas leitura/refresh neste contexto.
 * Operações CRUD são feitas por componentes específicos.
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Checkout, PaymentLink } from "../../types/product.types";

interface UseProductCheckoutsOptions {
  productId: string | null;
}

interface UseProductCheckoutsReturn {
  checkouts: Checkout[];
  paymentLinks: PaymentLink[];
  refreshCheckouts: () => Promise<void>;
  refreshPaymentLinks: () => Promise<void>;
}

export function useProductCheckouts({
  productId,
}: UseProductCheckoutsOptions): UseProductCheckoutsReturn {
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);

  // ---------------------------------------------------------------------------
  // REFRESH CHECKOUTS
  // ---------------------------------------------------------------------------

  const refreshCheckouts = useCallback(async () => {
    if (!productId) return;

    try {
      const { data, error } = await supabase
        .from("checkouts")
        .select(
          `
          *,
          products (
            name,
            price
          ),
          checkout_links (
            payment_links (
              offers (
                name,
                price
              )
            )
          )
        `
        )
        .eq("product_id", productId)
        .neq("status", "deleted")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCheckouts(
        (data || []).map((checkout) => {
          const checkoutLink = (checkout as any)?.checkout_links?.[0];
          const paymentLink = checkoutLink?.payment_links;
          const offer = paymentLink?.offers;

          return {
            id: checkout.id,
            name: checkout.name,
            price: offer?.price || checkout.products?.price || 0,
            visits: (checkout as any).visits_count || 0,
            offer: offer?.name || checkout.products?.name || "",
            isDefault: (checkout as any).is_default || false,
            linkId: checkoutLink?.link_id || "",
            product_id: checkout.product_id,
            status: checkout.status,
            created_at: checkout.created_at,
          };
        })
      );
    } catch (error: unknown) {
      console.error("[useProductCheckouts] Error loading checkouts:", error);
    }
  }, [productId]);

  // ---------------------------------------------------------------------------
  // REFRESH PAYMENT LINKS
  // ---------------------------------------------------------------------------

  const refreshPaymentLinks = useCallback(async () => {
    if (!productId) return;

    try {
      // Buscar ofertas do produto
      const { data: offersData, error: offersError } = await supabase
        .from("offers")
        .select("id")
        .eq("product_id", productId);

      if (offersError) throw offersError;

      const offerIds = (offersData || []).map((o) => o.id);

      if (offerIds.length === 0) {
        setPaymentLinks([]);
        return;
      }

      // Buscar payment_links dessas ofertas
      const { data: linksData, error: linksError } = await supabase
        .from("payment_links")
        .select(
          `
          id,
          slug,
          url,
          status,
          offers (
            id,
            name,
            price,
            is_default,
            product_id
          )
        `
        )
        .in("offer_id", offerIds);

      if (linksError) throw linksError;

      // Para cada link, buscar checkouts associados
      const linksWithCheckouts = await Promise.all(
        (linksData || []).map(async (link: any) => {
          const { data: checkoutLinksData } = await supabase
            .from("checkout_links")
            .select("checkout_id")
            .eq("link_id", link.id);

          const checkoutIds = (checkoutLinksData || []).map(
            (cl: any) => cl.checkout_id
          );
          const { data: checkoutsData } = await supabase
            .from("checkouts")
            .select("id, name")
            .in("id", checkoutIds);

          return {
            id: link.id,
            slug: link.slug,
            url: link.url,
            offer_name: link.offers?.name || "",
            offer_price: Number(link.offers?.price || 0),
            is_default: link.offers?.is_default || false,
            status: link.status || "active",
            checkouts: checkoutsData || [],
          };
        })
      );

      setPaymentLinks(linksWithCheckouts);
    } catch (error: unknown) {
      console.error("[useProductCheckouts] Error loading payment links:", error);
    }
  }, [productId]);

  return {
    checkouts,
    paymentLinks,
    refreshCheckouts,
    refreshPaymentLinks,
  };
}
