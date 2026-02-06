/**
 * Checkout Editor Machine - Async Actors
 * 
 * Load/Save actors for the checkout editor state machine.
 * Absorbs logic from useCheckoutPersistence.
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module checkout-customizer/machines
 */

import { fromPromise } from "xstate";
import { api } from "@/lib/api";
import { parseJsonSafely } from "@/lib/utils";
import { normalizeDesign } from "@/lib/checkout/normalizeDesign";
import { hasPendingUploads, waitForUploadsToFinish, getAllComponentsFromCustomization } from "@/lib/uploadUtils";
import { createLogger } from "@/lib/logger";
import { toast } from "sonner";
import { DEFAULT_CHECKOUT_DESIGN } from "@/hooks/checkout/defaultCheckoutDesign";
import type {
  LoadEditorInput,
  LoadEditorOutput,
  SaveEditorInput,
  SaveEditorOutput,
} from "./checkoutEditorMachine.types";
import type { CheckoutCustomization } from "@/types/checkoutEditor";
import type { OrderBump } from "@/types/checkout";
import type { OrderBumpApiResponse } from "../types";

const log = createLogger("CheckoutEditorMachine.actors");

// ============================================================================
// LOAD ACTOR
// ============================================================================

interface EditorDataResponse {
  success: boolean;
  error?: string;
  data?: {
    checkout: Record<string, unknown>;
    product: Record<string, unknown>;
    offers?: unknown[];
    orderBumps?: OrderBumpApiResponse[];
  };
}

export const loadEditorActor = fromPromise<LoadEditorOutput, LoadEditorInput>(
  async ({ input }) => {
    const { checkoutId } = input;

    if (!checkoutId) {
      throw new Error("Checkout ID não fornecido");
    }

    const { data: response, error } = await api.call<EditorDataResponse>(
      "checkout-editor",
      {
        action: "get-editor-data",
        checkoutId,
      }
    );

    if (error) throw error;
    if (!response?.success) throw new Error(response?.error || "Erro ao carregar dados");

    const { checkout, product, offers, orderBumps: bumps } = response.data || {};
    if (!checkout || !product) throw new Error("Dados do checkout não encontrados");

    const checkoutAny = checkout as Record<string, unknown>;
    const productAny = product as Record<string, unknown>;

    // Extract offer price
    const checkoutLinks = checkoutAny.checkout_links as Array<{
      payment_links?: { offers?: { price?: number } };
    }> | undefined;
    const checkoutLink = checkoutLinks?.[0];
    const paymentLink = checkoutLink?.payment_links;
    const offer = paymentLink?.offers;
    const offerPrice = offer?.price || (productAny.price as number) || 0;

    // Normalize design using SSOT utility
    const themePreset = normalizeDesign(checkoutAny);

    const designWithFallbacks = {
      theme: (checkoutAny.theme as string) || "light",
      font: (checkoutAny.font as string) || "Inter",
      colors: themePreset.colors,
      backgroundImage: (
        parseJsonSafely(checkoutAny.design as string, {}) as {
          backgroundImage?: {
            url?: string;
            fixed?: boolean;
            repeat?: boolean;
            expand?: boolean;
          };
        }
      )?.backgroundImage,
    };

    // Build desktop customization
    const desktopCustomization: CheckoutCustomization = {
      design: designWithFallbacks as CheckoutCustomization["design"],
      topComponents: parseJsonSafely(checkoutAny.top_components as string, []),
      bottomComponents: parseJsonSafely(checkoutAny.bottom_components as string, []),
    };

    // Build mobile customization from mobile columns
    const mobileTop = parseJsonSafely(checkoutAny.mobile_top_components as string, []);
    const mobileBottom = parseJsonSafely(checkoutAny.mobile_bottom_components as string, []);

    // Determine sync state: mobile is synced if no mobile components exist
    const hasMobileComponents =
      (Array.isArray(mobileTop) && mobileTop.length > 0) ||
      (Array.isArray(mobileBottom) && mobileBottom.length > 0);

    const isMobileSynced = !hasMobileComponents;

    const mobileCustomization: CheckoutCustomization = isMobileSynced
      ? JSON.parse(JSON.stringify(desktopCustomization))
      : {
          design: designWithFallbacks as CheckoutCustomization["design"],
          topComponents: mobileTop,
          bottomComponents: mobileBottom,
        };

    // Map order bumps
    let orderBumps: OrderBump[] = [];
    if (bumps && bumps.length > 0) {
      orderBumps = bumps.map(
        (bump: OrderBumpApiResponse): OrderBump => ({
          id: bump.id,
          name: bump.custom_title || bump.products?.name || "Produto",
          price: bump.offers?.price || bump.products?.price || 0,
          image_url: bump.show_image ? bump.products?.image_url : undefined,
          description: bump.custom_description,
        })
      );
    }

    return {
      desktopCustomization,
      mobileCustomization,
      isMobileSynced,
      productData: { ...productAny, price: offerPrice } as LoadEditorOutput["productData"],
      orderBumps,
      productOffers: (offers || []) as LoadEditorOutput["productOffers"],
      currentLinks: [],
    };
  }
);

// ============================================================================
// SAVE ACTOR
// ============================================================================

export const saveEditorActor = fromPromise<SaveEditorOutput, SaveEditorInput>(
  async ({ input }) => {
    const { checkoutId, desktopCustomization, mobileCustomization, isMobileSynced } = input;

    if (!checkoutId) {
      throw new Error("Checkout ID não fornecido");
    }

    toast.info("Salvando...");

    // Check pending uploads for both viewports
    if (
      hasPendingUploads(desktopCustomization) ||
      hasPendingUploads(mobileCustomization)
    ) {
      try {
        await waitForUploadsToFinish(() => desktopCustomization, 45000);
        await waitForUploadsToFinish(() => mobileCustomization, 45000);
      } catch {
        toast.error("Erro no upload de imagem");
        throw new Error("Upload timeout");
      }
    }

    // Collect old paths for cleanup
    const oldPaths: string[] = [];
    getAllComponentsFromCustomization(desktopCustomization).forEach((c: { content?: Record<string, unknown> }) => {
      if (c.content?._old_storage_path) oldPaths.push(c.content._old_storage_path as string);
    });
    getAllComponentsFromCustomization(mobileCustomization).forEach((c: { content?: Record<string, unknown> }) => {
      if (c.content?._old_storage_path) oldPaths.push(c.content._old_storage_path as string);
    });

    const { data: response, error } = await api.call<EditorDataResponse>(
      "checkout-editor",
      {
        action: "update-design",
        checkoutId,
        design: desktopCustomization.design,
        topComponents: desktopCustomization.topComponents,
        bottomComponents: desktopCustomization.bottomComponents,
        mobileTopComponents: isMobileSynced ? [] : mobileCustomization.topComponents,
        mobileBottomComponents: isMobileSynced ? [] : mobileCustomization.bottomComponents,
      }
    );

    if (error) throw error;
    if (!response?.success) throw new Error(response?.error || "Erro ao salvar");

    // Cleanup old storage paths (fire-and-forget)
    if (oldPaths.length > 0) {
      fetch("/api/storage/remove", {
        method: "POST",
        body: JSON.stringify({ paths: oldPaths, bucket: "product-images" }),
      }).catch(console.error);
    }

    toast.success("Checkout salvo!");

    return { success: true };
  }
);
