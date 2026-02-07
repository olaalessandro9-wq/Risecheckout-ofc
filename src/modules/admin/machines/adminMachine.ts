/**
 * Admin Machine - XState State Machine
 * 
 * RISE Protocol V3 - Score 10.0/10
 * 
 * Single Source of Truth for the entire Admin module.
 * Uses a simplified event-based state machine pattern compatible with XState v5.
 * 
 * @version 2.0.0 - Refatorado para <300 linhas
 */

import { setup, assign } from "xstate";
import type { AppRole } from "@/hooks/usePermissions";
import type { 
  AdminMachineContext, 
  AdminMachineEvent,
} from "./adminMachine.types";
import { createInitialContext } from "./adminMachine.types";

// ============================================================================
// MACHINE SETUP
// ============================================================================

export const adminMachine = setup({
  types: {
    context: {} as AdminMachineContext,
    events: {} as AdminMachineEvent,
    input: {} as { callerRole: AppRole },
  },
  guards: {
    isOwner: ({ context }) => context.callerRole === "owner",
    isAdminOrOwner: ({ context }) => 
      context.callerRole === "admin" || context.callerRole === "owner",
  },
}).createMachine({
  id: "admin",
  initial: "active",
  context: ({ input }) => createInitialContext(input.callerRole),
  
  states: {
    active: {
      on: {
        // Navigation
        CHANGE_TAB: { actions: assign({ activeTab: ({ event }) => event.tab }) },
        SET_PERIOD: { actions: assign({ period: ({ event }) => event.period }) },
        
        // Users
        LOAD_USERS: { actions: assign({ usersLoading: true, users: ({ context }) => ({ ...context.users, error: null }) }) },
        REFRESH_USERS: { actions: assign({ usersLoading: true, users: ({ context }) => ({ ...context.users, error: null }) }) },
        USERS_LOADED: { actions: assign({ usersLoading: false, users: ({ context, event }) => ({ ...context.users, items: event.data.users, emailsMap: event.data.emails, error: null }) }) },
        USERS_ERROR: { actions: assign({ usersLoading: false, users: ({ context, event }) => ({ ...context.users, error: event.error }) }) },
        SELECT_USER: { actions: assign({ users: ({ context, event }) => ({ ...context.users, selectedUser: event.user }) }) },
        DESELECT_USER: { actions: assign({ users: ({ context }) => ({ ...context.users, selectedUser: null }) }) },
        SET_USERS_SEARCH: { actions: assign({ users: ({ context, event }) => ({ ...context.users, searchTerm: event.term }) }) },
        SET_USERS_STATUS_FILTER: { actions: assign({ users: ({ context, event }) => ({ ...context.users, statusFilter: event.filter }) }) },
        OPEN_ROLE_CHANGE: { actions: assign({ users: ({ context, event }) => ({ ...context.users, roleChangeDialog: event.dialog, mfaError: null }) }) },
        CONFIRM_ROLE_CHANGE: { actions: assign({ usersLoading: true, users: ({ context }) => ({ ...context.users, mfaError: null }) }) },
        ROLE_CHANGE_SUCCESS: { actions: assign({ usersLoading: false, users: ({ context }) => ({ ...context.users, roleChangeDialog: null, mfaError: null }) }) },
        ROLE_CHANGE_ERROR: { actions: assign({ usersLoading: false, users: ({ context, event }) => ({ ...context.users, roleChangeDialog: null, mfaError: null, error: event.error }) }) },
        ROLE_CHANGE_MFA_ERROR: { actions: assign({ usersLoading: false, users: ({ context, event }) => ({ ...context.users, mfaError: event.error }) }) },
        CANCEL_ROLE_CHANGE: { actions: assign({ users: ({ context }) => ({ ...context.users, roleChangeDialog: null, mfaError: null }) }) },

        // Products
        LOAD_PRODUCTS: { actions: assign({ productsLoading: true, products: ({ context }) => ({ ...context.products, error: null }) }) },
        REFRESH_PRODUCTS: { actions: assign({ productsLoading: true, products: ({ context }) => ({ ...context.products, error: null }) }) },
        PRODUCTS_LOADED: { actions: assign({ productsLoading: false, products: ({ context, event }) => ({ ...context.products, items: event.data, error: null }) }) },
        PRODUCTS_ERROR: { actions: assign({ productsLoading: false, products: ({ context, event }) => ({ ...context.products, error: event.error }) }) },
        SELECT_PRODUCT: { actions: assign({ products: ({ context, event }) => ({ ...context.products, selectedProductId: event.productId }) }) },
        DESELECT_PRODUCT: { actions: assign({ products: ({ context }) => ({ ...context.products, selectedProductId: null }) }) },
        SET_PRODUCTS_SEARCH: { actions: assign({ products: ({ context, event }) => ({ ...context.products, searchTerm: event.term }) }) },
        SET_PRODUCTS_STATUS_FILTER: { actions: assign({ products: ({ context, event }) => ({ ...context.products, statusFilter: event.filter }) }) },
        OPEN_PRODUCT_ACTION: { actions: assign({ products: ({ context, event }) => ({ ...context.products, actionDialog: event.dialog }) }) },
        CONFIRM_PRODUCT_ACTION: { actions: assign({ productsLoading: true }) },
        PRODUCT_ACTION_SUCCESS: { actions: assign({ productsLoading: false, products: ({ context }) => ({ ...context.products, actionDialog: null }) }) },
        PRODUCT_ACTION_ERROR: { actions: assign({ productsLoading: false, products: ({ context, event }) => ({ ...context.products, actionDialog: null, error: event.error }) }) },
        CANCEL_PRODUCT_ACTION: { actions: assign({ products: ({ context }) => ({ ...context.products, actionDialog: null }) }) },

        // Orders
        LOAD_ORDERS: { actions: assign({ ordersLoading: true, orders: ({ context }) => ({ ...context.orders, error: null }) }) },
        REFRESH_ORDERS: { actions: assign({ ordersLoading: true, orders: ({ context }) => ({ ...context.orders, error: null }) }) },
        ORDERS_LOADED: { actions: assign({ ordersLoading: false, orders: ({ context, event }) => ({ ...context.orders, items: event.data, error: null }) }) },
        ORDERS_ERROR: { actions: assign({ ordersLoading: false, orders: ({ context, event }) => ({ ...context.orders, error: event.error }) }) },
        SELECT_ORDER: { actions: assign({ orders: ({ context, event }) => ({ ...context.orders, selectedOrder: event.order }) }) },
        DESELECT_ORDER: { actions: assign({ orders: ({ context }) => ({ ...context.orders, selectedOrder: null }) }) },
        SET_ORDERS_SEARCH: { actions: assign({ orders: ({ context, event }) => ({ ...context.orders, searchTerm: event.term, currentPage: 1 }) }) },
        SET_ORDERS_STATUS_FILTER: { actions: assign({ orders: ({ context, event }) => ({ ...context.orders, statusFilter: event.filter, currentPage: 1 }) }) },
        SET_ORDERS_SORT: { actions: assign({ orders: ({ context, event }) => ({ ...context.orders, sortField: event.field, sortDirection: event.direction }) }) },
        SET_ORDERS_PAGE: { actions: assign({ orders: ({ context, event }) => ({ ...context.orders, currentPage: event.page }) }) },

        // Security
        LOAD_SECURITY: { actions: assign({ securityLoading: true, security: ({ context }) => ({ ...context.security, error: null }) }) },
        REFRESH_SECURITY: { actions: assign({ securityLoading: true, security: ({ context }) => ({ ...context.security, error: null }) }) },
        SECURITY_LOADED: { actions: assign({ securityLoading: false, security: ({ context, event }) => ({ ...context.security, alerts: event.data.alerts, blockedIPs: event.data.blockedIPs, stats: event.data.stats, error: null }) }) },
        SECURITY_ERROR: { actions: assign({ securityLoading: false, security: ({ context, event }) => ({ ...context.security, error: event.error }) }) },
        SELECT_ALERT: { actions: assign({ security: ({ context, event }) => ({ ...context.security, selectedAlert: event.alert }) }) },
        DESELECT_ALERT: { actions: assign({ security: ({ context }) => ({ ...context.security, selectedAlert: null }) }) },
        ACKNOWLEDGE_ALERT: { actions: assign({ securityLoading: true }) },
        ALERT_ACKNOWLEDGED: { actions: assign({ securityLoading: false }) },
        SET_SECURITY_FILTERS: { actions: assign({ security: ({ context, event }) => ({ ...context.security, filters: event.filters }) }) },
        OPEN_BLOCK_DIALOG: { actions: assign({ security: ({ context, event }) => ({ ...context.security, blockDialogOpen: true, blockDialogIP: event.ip ?? "" }) }) },
        CLOSE_BLOCK_DIALOG: { actions: assign({ security: ({ context }) => ({ ...context.security, blockDialogOpen: false, blockDialogIP: "" }) }) },
        CONFIRM_BLOCK_IP: { actions: assign({ securityLoading: true }) },
        BLOCK_IP_SUCCESS: { actions: assign({ securityLoading: false, security: ({ context }) => ({ ...context.security, blockDialogOpen: false, blockDialogIP: "" }) }) },
        OPEN_UNBLOCK_DIALOG: { actions: assign({ security: ({ context, event }) => ({ ...context.security, unblockDialogOpen: true, unblockDialogIP: event.blocked }) }) },
        CLOSE_UNBLOCK_DIALOG: { actions: assign({ security: ({ context }) => ({ ...context.security, unblockDialogOpen: false, unblockDialogIP: null }) }) },
        CONFIRM_UNBLOCK_IP: { actions: assign({ securityLoading: true }) },
        UNBLOCK_IP_SUCCESS: { actions: assign({ securityLoading: false, security: ({ context }) => ({ ...context.security, unblockDialogOpen: false, unblockDialogIP: null }) }) },
        TOGGLE_AUTO_REFRESH: { actions: assign({ security: ({ context }) => ({ ...context.security, autoRefresh: !context.security.autoRefresh }) }) },
      },
    },
  },
});

export type AdminMachine = typeof adminMachine;
