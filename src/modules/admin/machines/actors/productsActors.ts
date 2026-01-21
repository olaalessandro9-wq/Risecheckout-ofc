/**
 * Products Actors - Data Fetching for Products Region
 * 
 * RISE Protocol V3 - XState Actors
 * 
 * @version 1.0.0
 */

import { fromPromise } from "xstate";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import type { LoadProductsInput, ProductActionInput } from "../adminMachine.types";
import type { ProductWithMetrics } from "../../types/admin.types";

const log = createLogger("AdminProductsActors");

// ============================================================================
// LOAD PRODUCTS ACTOR
// ============================================================================

export const loadProductsActor = fromPromise<ProductWithMetrics[], LoadProductsInput>(
  async ({ input }) => {
    log.info("Loading admin products", { period: input.period });

    const { data, error } = await api.call<{ products: ProductWithMetrics[] }>(
      "admin-data",
      {
        action: "products-with-metrics",
        period: input.period,
      }
    );

    if (error) {
      log.error("Failed to load products", { error: error.message });
      throw new Error(error.message || "Erro ao carregar produtos");
    }

    const products = data?.products ?? [];
    log.info("Products loaded successfully", { count: products.length });

    return products;
  }
);

// ============================================================================
// PRODUCT ACTION ACTOR
// ============================================================================

export const productActionActor = fromPromise<void, ProductActionInput>(
  async ({ input }) => {
    log.info("Executing product action", { productId: input.productId, action: input.action });

    const actionMap: Record<string, string> = {
      activate: "activate-product",
      block: "block-product",
      delete: "delete-product",
    };

    const { data, error } = await api.call<{ success: boolean; error?: string }>(
      "admin-product-management",
      {
        action: actionMap[input.action],
        productId: input.productId,
      }
    );

    if (error) {
      log.error("Product action failed", { error: error.message });
      throw new Error(error.message || `Erro ao ${input.action} produto`);
    }

    if (data?.error) {
      log.error("Product action returned error", { error: data.error });
      throw new Error(data.error);
    }

    log.info("Product action completed", { productId: input.productId, action: input.action });
  }
);
