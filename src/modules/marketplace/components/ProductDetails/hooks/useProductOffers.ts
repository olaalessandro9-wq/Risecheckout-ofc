/**
 * useProductOffers - Hook para buscar ofertas de um produto
 * 
 * Responsabilidade única: Fetch de ofertas via Edge Function
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import { buildUrl } from "@/lib/urls";

const log = createLogger("useProductOffers");

interface ProductOffersResponse {
  offers?: Array<{
    id: string;
    name: string | null;
    price: number;
    is_default: boolean | null;
  }>;
  error?: string;
}

export interface Offer {
  id: string;
  name: string;
  type: string;
  price: number;
  commission: number;
  checkoutUrl: string;
}

interface UseProductOffersParams {
  productId: string | null;
  commissionPercentage: number;
  productPrice: number;
  isOpen: boolean;
}

interface UseProductOffersReturn {
  offers: Offer[];
  loadingOffers: boolean;
  maxCommission: number;
}

export function useProductOffers({
  productId,
  commissionPercentage,
  productPrice,
  isOpen,
}: UseProductOffersParams): UseProductOffersReturn {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [maxCommission, setMaxCommission] = useState<number>(0);

  const fetchOffers = useCallback(async () => {
    if (!productId) return;

    setLoadingOffers(true);
    try {
      const { data, error } = await api.call<ProductOffersResponse>("admin-data", {
        action: "product-offers",
        productId,
      });

      if (error) throw new Error(error.message);

      const offersData = data?.offers || [];
      if (offersData.length > 0) {
        // Use centralized URL builder (SSOT) - replaces window.location.origin
        const mappedOffers: Offer[] = offersData.map((offer) => {
          const commission = (offer.price * commissionPercentage) / 100;
          return {
            id: offer.id,
            name: offer.name || "Oferta",
            type: offer.is_default ? "one_time" : "secondary",
            price: offer.price || 0,
            commission: commission,
            checkoutUrl: buildUrl(`/checkout/${offer.id}`, 'checkout'),
          };
        });

        setOffers(mappedOffers);

        const basePrice = productPrice || mappedOffers[0]?.price || 0;
        const maxComm = (basePrice * commissionPercentage) / 100;
        setMaxCommission(maxComm);
      } else {
        setOffers([]);
        const maxComm = (productPrice * commissionPercentage) / 100;
        setMaxCommission(maxComm);
      }
    } catch (error: unknown) {
      log.error("Erro ao buscar ofertas:", error);
      toast.error("Erro ao carregar ofertas do produto");
    } finally {
      setLoadingOffers(false);
    }
  }, [productId, commissionPercentage, productPrice]);

  useEffect(() => {
    if (isOpen && productId) {
      fetchOffers();
    }
  }, [isOpen, productId, fetchOffers]);

  return {
    offers,
    loadingOffers,
    maxCommission,
  };
}
