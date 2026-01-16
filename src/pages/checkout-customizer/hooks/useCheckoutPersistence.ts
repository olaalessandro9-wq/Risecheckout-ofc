/**
 * useCheckoutPersistence Hook
 * 
 * Handles load/save operations for checkout customizer.
 * RISE Protocol V2 Compliant - Clean Architecture
 * 
 * @version 1.0.0
 */

import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { parseJsonSafely } from "@/lib/utils";
import { hasPendingUploads, waitForUploadsToFinish, getAllComponentsFromCustomization } from "@/lib/uploadUtils";
import { normalizeDesign } from "@/lib/checkout/normalizeDesign";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getProducerSessionToken } from "@/hooks/useProducerAuth";
import type { CheckoutCustomization } from "@/hooks/useCheckoutEditor";
import type { OrderBump } from "@/types/checkout";
import type { CheckoutPersistenceState, OrderBumpApiResponse } from "../types";

interface UseCheckoutPersistenceProps {
  checkoutId: string | null;
  customization: CheckoutCustomization;
  setCustomization: (c: CheckoutCustomization) => void;
  setIsDirty: (dirty: boolean) => void;
}

interface UseCheckoutPersistenceReturn {
  state: CheckoutPersistenceState;
  loadCheckoutData: (id: string) => Promise<void>;
  handleSave: () => Promise<void>;
}

export function useCheckoutPersistence({
  checkoutId,
  customization,
  setCustomization,
  setIsDirty,
}: UseCheckoutPersistenceProps): UseCheckoutPersistenceReturn {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [productData, setProductData] = useState<CheckoutPersistenceState["productData"]>(null);
  const [orderBumps, setOrderBumps] = useState<OrderBump[]>([]);
  const [productOffers, setProductOffers] = useState<CheckoutPersistenceState["productOffers"]>([]);
  const [currentLinks, setCurrentLinks] = useState<CheckoutPersistenceState["currentLinks"]>([]);

  const loadCheckoutData = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const sessionToken = getProducerSessionToken();
      if (!sessionToken) {
        toast({ title: "Sessão expirada", description: "Faça login novamente", variant: "destructive" });
        navigate("/login");
        return;
      }

      const { data: response, error } = await supabase.functions.invoke('checkout-editor', {
        body: { action: 'get-editor-data', checkoutId: id },
        headers: { 'x-producer-session-token': sessionToken }
      });

      if (error) throw error;
      if (!response.success) throw new Error(response.error || 'Erro ao carregar dados');

      const { checkout, product, offers, orderBumps: bumps } = response.data;

      // Extract offer price
      const checkoutLink = checkout?.checkout_links?.[0];
      const paymentLink = checkoutLink?.payment_links;
      const offer = paymentLink?.offers;
      const offerPrice = offer?.price || product?.price || 0;
      
      // Use normalizeDesign utility
      const themePreset = normalizeDesign(checkout);
      
      const designWithFallbacks = {
        theme: checkout.theme || 'light',
        font: checkout.font || 'Inter',
        colors: themePreset.colors,
        backgroundImage: (parseJsonSafely(checkout.design, {}) as { backgroundImage?: { url?: string; fixed?: boolean; repeat?: boolean; expand?: boolean } })?.backgroundImage,
      };
      
      const loadedCustomization: CheckoutCustomization = {
         design: designWithFallbacks,
         topComponents: parseJsonSafely(checkout.top_components, []),
         bottomComponents: parseJsonSafely(checkout.bottom_components, []),
      };

      setCustomization(loadedCustomization);
      setProductData({ ...product, price: offerPrice });
      if (offers) setProductOffers(offers);

      // Map order bumps
      if (bumps && bumps.length > 0) {
        const mappedBumps = bumps.map((bump: OrderBumpApiResponse): OrderBump => ({
          id: bump.id,
          name: bump.custom_title || bump.products?.name || "Produto",
          price: bump.offers?.price || bump.products?.price || 0,
          image_url: bump.show_image ? bump.products?.image_url : undefined,
          description: bump.custom_description
        }));
        setOrderBumps(mappedBumps);
      } else {
        setOrderBumps([]);
      }
    } catch (error: unknown) {
      console.error('[useCheckoutPersistence] Load error:', error);
      toast({ title: "Erro ao carregar", description: error instanceof Error ? error.message : "Erro desconhecido", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [navigate, setCustomization, toast]);

  const handleSave = useCallback(async () => {
    if (!checkoutId) return;
    setIsSaving(true);
    toast({ title: "Salvando..." });

    const sessionToken = getProducerSessionToken();
    if (!sessionToken) {
      toast({ title: "Sessão expirada", description: "Faça login novamente", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    // Check pending uploads
    if (hasPendingUploads(customization)) {
       try {
           await waitForUploadsToFinish(() => customization, 45000);
       } catch {
           toast({ title: "Erro no upload", variant: "destructive" });
           setIsSaving(false);
           return;
       }
    }

    try {
        // Collect old paths for cleanup
        const oldPaths: string[] = [];
        getAllComponentsFromCustomization(customization).forEach(c => {
            if (c.content?._old_storage_path) oldPaths.push(c.content._old_storage_path);
        });

        const { data: response, error } = await supabase.functions.invoke('checkout-editor', {
          body: {
            action: 'update-design',
            checkoutId,
            design: customization.design,
            topComponents: customization.topComponents,
            bottomComponents: customization.bottomComponents,
          },
          headers: { 'x-producer-session-token': sessionToken }
        });

        if (error) throw error;
        if (!response.success) throw new Error(response.error || 'Erro ao salvar');

        // Cleanup old storage paths
        if (oldPaths.length > 0) {
            fetch("/api/storage/remove", { 
                method: "POST", 
                body: JSON.stringify({ paths: oldPaths, bucket: "product-images" }) 
            }).catch(console.error);
        }

        setIsDirty(false);
        toast({ title: "Sucesso!", description: "Checkout salvo." });

    } catch (error: unknown) {
        console.error('[useCheckoutPersistence] Save error:', error);
        toast({ title: "Erro ao salvar", description: error instanceof Error ? error.message : "Erro desconhecido", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  }, [checkoutId, customization, setIsDirty, toast]);

  return {
    state: {
      loading,
      isSaving,
      productData,
      orderBumps,
      productOffers,
      currentLinks,
    },
    loadCheckoutData,
    handleSave,
  };
}
