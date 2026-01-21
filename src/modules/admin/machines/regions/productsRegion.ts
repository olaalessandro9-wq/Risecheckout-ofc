/**
 * Products Region - Parallel State for Admin Products Tab
 * 
 * RISE Protocol V3 - XState Parallel Region
 * 
 * Manages: product listing, filtering, actions (block/delete/activate)
 * 
 * @version 1.0.0
 */

import { assign } from "xstate";
import type { AdminMachineContext, ProductsEvent } from "../adminMachine.types";
import type { ProductWithMetrics, ProductActionDialog, ProductStatusFilter } from "../../types/admin.types";

// ============================================================================
// ACTIONS
// ============================================================================

export const productsActions = {
  assignProductsData: assign(({ context }, params: { products: ProductWithMetrics[] }) => ({
    products: {
      ...context.products,
      items: params.products,
      error: null,
    },
  })),

  assignProductsError: assign(({ context }, params: { error: unknown }) => ({
    products: {
      ...context.products,
      error: params.error instanceof Error ? params.error.message : "Erro ao carregar produtos",
    },
  })),

  assignSelectedProduct: assign(({ context }, params: { productId: string }) => ({
    products: {
      ...context.products,
      selectedProductId: params.productId,
    },
  })),

  clearSelectedProduct: assign(({ context }) => ({
    products: {
      ...context.products,
      selectedProductId: null,
    },
  })),

  assignProductsSearch: assign(({ context }, params: { term: string }) => ({
    products: {
      ...context.products,
      searchTerm: params.term,
    },
  })),

  assignProductsStatusFilter: assign(({ context }, params: { filter: ProductStatusFilter }) => ({
    products: {
      ...context.products,
      statusFilter: params.filter,
    },
  })),

  assignProductActionDialog: assign(({ context }, params: { dialog: ProductActionDialog }) => ({
    products: {
      ...context.products,
      actionDialog: params.dialog,
    },
  })),

  clearProductActionDialog: assign(({ context }) => ({
    products: {
      ...context.products,
      actionDialog: null,
    },
  })),
};

// ============================================================================
// REGION STATE
// ============================================================================

export const productsRegion = {
  initial: "idle" as const,
  states: {
    idle: {
      on: {
        LOAD_PRODUCTS: { target: "loading" },
      },
    },
    loading: {
      invoke: {
        id: "loadProducts",
        src: "loadProductsActor",
        input: ({ context }: { context: AdminMachineContext }) => ({
          period: context.period,
        }),
        onDone: {
          target: "ready",
          actions: {
            type: "assignProductsData",
            params: ({ event }: { event: { output: ProductWithMetrics[] } }) => ({
              products: event.output,
            }),
          },
        },
        onError: {
          target: "error",
          actions: {
            type: "assignProductsError",
            params: ({ event }: { event: { error: unknown } }) => ({
              error: event.error,
            }),
          },
        },
      },
    },
    ready: {
      on: {
        SELECT_PRODUCT: {
          actions: {
            type: "assignSelectedProduct",
            params: ({ event }: { event: Extract<ProductsEvent, { type: "SELECT_PRODUCT" }> }) => ({
              productId: event.productId,
            }),
          },
        },
        DESELECT_PRODUCT: {
          actions: "clearSelectedProduct",
        },
        SET_PRODUCTS_SEARCH: {
          actions: {
            type: "assignProductsSearch",
            params: ({ event }: { event: Extract<ProductsEvent, { type: "SET_PRODUCTS_SEARCH" }> }) => ({
              term: event.term,
            }),
          },
        },
        SET_PRODUCTS_STATUS_FILTER: {
          actions: {
            type: "assignProductsStatusFilter",
            params: ({ event }: { event: Extract<ProductsEvent, { type: "SET_PRODUCTS_STATUS_FILTER" }> }) => ({
              filter: event.filter,
            }),
          },
        },
        OPEN_PRODUCT_ACTION: {
          actions: {
            type: "assignProductActionDialog",
            params: ({ event }: { event: Extract<ProductsEvent, { type: "OPEN_PRODUCT_ACTION" }> }) => ({
              dialog: event.dialog,
            }),
          },
        },
        CONFIRM_PRODUCT_ACTION: { target: "executingAction" },
        CANCEL_PRODUCT_ACTION: {
          actions: "clearProductActionDialog",
        },
        REFRESH_PRODUCTS: { target: "loading" },
      },
    },
    executingAction: {
      invoke: {
        id: "executeProductAction",
        src: "productActionActor",
        input: ({ context }: { context: AdminMachineContext }) => ({
          productId: context.products.actionDialog?.productId ?? "",
          action: context.products.actionDialog?.action ?? "activate",
        }),
        onDone: {
          target: "loading",
          actions: "clearProductActionDialog",
        },
        onError: {
          target: "ready",
          actions: [
            {
              type: "assignProductsError",
              params: ({ event }: { event: { error: unknown } }) => ({
                error: event.error,
              }),
            },
            "clearProductActionDialog",
          ],
        },
      },
    },
    error: {
      on: {
        RETRY_PRODUCTS: { target: "loading" },
        LOAD_PRODUCTS: { target: "loading" },
      },
    },
  },
};
