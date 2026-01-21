/**
 * Orders Region - Parallel State for Admin Orders Tab
 * 
 * RISE Protocol V3 - XState Parallel Region
 * 
 * Manages: order listing, filtering, sorting, pagination, selection
 * 
 * @version 1.0.0
 */

import { assign } from "xstate";
import type { AdminMachineContext, OrdersEvent } from "../adminMachine.types";
import type { AdminOrder, OrderSortField, SortDirection } from "../../types/admin.types";

// ============================================================================
// ACTIONS
// ============================================================================

export const ordersActions = {
  assignOrdersData: assign(({ context }, params: { orders: AdminOrder[] }) => ({
    orders: {
      ...context.orders,
      items: params.orders,
      error: null,
    },
  })),

  assignOrdersError: assign(({ context }, params: { error: unknown }) => ({
    orders: {
      ...context.orders,
      error: params.error instanceof Error ? params.error.message : "Erro ao carregar pedidos",
    },
  })),

  assignSelectedOrder: assign(({ context }, params: { order: AdminOrder }) => ({
    orders: {
      ...context.orders,
      selectedOrder: params.order,
    },
  })),

  clearSelectedOrder: assign(({ context }) => ({
    orders: {
      ...context.orders,
      selectedOrder: null,
    },
  })),

  assignOrdersSearch: assign(({ context }, params: { term: string }) => ({
    orders: {
      ...context.orders,
      searchTerm: params.term,
      currentPage: 1, // Reset page on search
    },
  })),

  assignOrdersStatusFilter: assign(({ context }, params: { filter: string }) => ({
    orders: {
      ...context.orders,
      statusFilter: params.filter,
      currentPage: 1, // Reset page on filter
    },
  })),

  assignOrdersSort: assign(({ context }, params: { field: OrderSortField; direction: SortDirection }) => ({
    orders: {
      ...context.orders,
      sortField: params.field,
      sortDirection: params.direction,
    },
  })),

  assignOrdersPage: assign(({ context }, params: { page: number }) => ({
    orders: {
      ...context.orders,
      currentPage: params.page,
    },
  })),
};

// ============================================================================
// REGION STATE
// ============================================================================

export const ordersRegion = {
  initial: "idle" as const,
  states: {
    idle: {
      on: {
        LOAD_ORDERS: { target: "loading" },
      },
    },
    loading: {
      invoke: {
        id: "loadOrders",
        src: "loadOrdersActor",
        input: ({ context }: { context: AdminMachineContext }) => ({
          period: context.period,
        }),
        onDone: {
          target: "ready",
          actions: {
            type: "assignOrdersData",
            params: ({ event }: { event: { output: AdminOrder[] } }) => ({
              orders: event.output,
            }),
          },
        },
        onError: {
          target: "error",
          actions: {
            type: "assignOrdersError",
            params: ({ event }: { event: { error: unknown } }) => ({
              error: event.error,
            }),
          },
        },
      },
    },
    ready: {
      on: {
        SELECT_ORDER: {
          actions: {
            type: "assignSelectedOrder",
            params: ({ event }: { event: Extract<OrdersEvent, { type: "SELECT_ORDER" }> }) => ({
              order: event.order,
            }),
          },
        },
        DESELECT_ORDER: {
          actions: "clearSelectedOrder",
        },
        SET_ORDERS_SEARCH: {
          actions: {
            type: "assignOrdersSearch",
            params: ({ event }: { event: Extract<OrdersEvent, { type: "SET_ORDERS_SEARCH" }> }) => ({
              term: event.term,
            }),
          },
        },
        SET_ORDERS_STATUS_FILTER: {
          actions: {
            type: "assignOrdersStatusFilter",
            params: ({ event }: { event: Extract<OrdersEvent, { type: "SET_ORDERS_STATUS_FILTER" }> }) => ({
              filter: event.filter,
            }),
          },
        },
        SET_ORDERS_SORT: {
          actions: {
            type: "assignOrdersSort",
            params: ({ event }: { event: Extract<OrdersEvent, { type: "SET_ORDERS_SORT" }> }) => ({
              field: event.field,
              direction: event.direction,
            }),
          },
        },
        SET_ORDERS_PAGE: {
          actions: {
            type: "assignOrdersPage",
            params: ({ event }: { event: Extract<OrdersEvent, { type: "SET_ORDERS_PAGE" }> }) => ({
              page: event.page,
            }),
          },
        },
        REFRESH_ORDERS: { target: "loading" },
      },
    },
    error: {
      on: {
        RETRY_ORDERS: { target: "loading" },
        LOAD_ORDERS: { target: "loading" },
      },
    },
  },
};
