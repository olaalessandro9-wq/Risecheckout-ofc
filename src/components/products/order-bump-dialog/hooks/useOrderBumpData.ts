import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { fetchOrderBumpCandidates } from "@/lib/orderBump/fetchCandidates";
import { fetchOffersByProduct, NormalizedOffer } from "@/services/offers";
import { OrderBumpProduct } from "../types";
import { createLogger } from "@/lib/logger";

const log = createLogger("UseOrderBumpData");

interface UseOrderBumpDataProps {
  open: boolean;
  productId: string;
  selectedProductId: string;
  userId: string;
  onOffersLoaded: (offers: NormalizedOffer[]) => void;
}

export function useOrderBumpData({
  open,
  productId,
  selectedProductId,
  userId,
  onOffersLoaded,
}: UseOrderBumpDataProps) {
  const [products, setProducts] = useState<OrderBumpProduct[]>([]);
  const [offers, setOffers] = useState<NormalizedOffer[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // Track last loaded product to avoid duplicate fetches
  const lastLoadedProductRef = useRef<string>("");

  // Load products when dialog opens
  useEffect(() => {
    if (!open || !userId) return;

    let active = true;
    setLoadingProducts(true);

    fetchOrderBumpCandidates(userId, { excludeProductId: productId })
      .then((rows) => {
        if (!active) return;
        setProducts(rows as OrderBumpProduct[]);
      })
      .catch((err) => {
        if (!active) return;
        toast.error("Erro ao carregar produtos");
        log.error("Load products failed:", err);
        setProducts([]);
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });

    return () => {
      active = false;
    };
  }, [open, productId, userId]);

  // Load offers when product changes
  useEffect(() => {
    if (!selectedProductId) {
      setOffers([]);
      lastLoadedProductRef.current = "";
      return;
    }

    // Avoid duplicate fetches for the same product
    if (lastLoadedProductRef.current === selectedProductId) {
      return;
    }

    let active = true;

    const loadOffers = async () => {
      try {
        const offersList = await fetchOffersByProduct(selectedProductId);
        if (!active) return;
        
        lastLoadedProductRef.current = selectedProductId;
        setOffers(offersList);
        onOffersLoaded(offersList);
      } catch (error: unknown) {
        if (!active) return;
        log.error("Error loading offers:", error);
        toast.error(`Erro ao carregar ofertas: ${error instanceof Error ? error.message : "erro desconhecido"}`);
      }
    };

    loadOffers();

    return () => {
      active = false;
    };
  }, [selectedProductId, onOffersLoaded]);

  // Reset lastLoadedProductRef when dialog closes
  useEffect(() => {
    if (!open) {
      lastLoadedProductRef.current = "";
    }
  }, [open]);

  return {
    products,
    offers,
    loadingProducts,
  };
}
