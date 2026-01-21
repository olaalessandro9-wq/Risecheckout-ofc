/**
 * Admin Context - React Context for Admin State Machine
 * 
 * RISE Protocol V3 - Score 10.0/10
 * 
 * Provides the admin state machine to all admin components.
 * Single Source of Truth via XState.
 * 
 * @version 2.0.0 - Refatorado para <300 linhas
 */

import { createContext, useContext, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useMachine } from "@xstate/react";
import { adminMachine } from "../machines/adminMachine";
import { usePermissions } from "@/hooks/usePermissions";
import type { 
  AdminMachineContext,
  AdminMachineEvent,
} from "../machines/adminMachine.types";
import type { 
  AdminTabId,
  PeriodFilter,
  SelectedUserData,
  RoleChangeDialog,
  ProductActionDialog,
  AdminOrder,
  SecurityAlert,
  BlockedIP,
  AlertFilters,
  OrderSortField,
  SortDirection,
  ProductStatusFilter,
} from "../types/admin.types";
import { fetchUsers, fetchProducts, fetchOrders, fetchSecurity } from "./adminFetchers";
import { 
  handleConfirmRoleChange, 
  handleConfirmProductAction, 
  handleAcknowledgeAlert,
  handleConfirmBlockIP,
  handleConfirmUnblockIP,
} from "./adminHandlers";

// ============================================================================
// CONTEXT TYPE
// ============================================================================

export interface AdminContextValue {
  context: AdminMachineContext;
  send: (event: AdminMachineEvent) => void;
  isUsersLoading: boolean;
  isProductsLoading: boolean;
  isOrdersLoading: boolean;
  isSecurityLoading: boolean;
  changeTab: (tab: AdminTabId) => void;
  setPeriod: (period: PeriodFilter) => void;
  loadUsers: () => void;
  refreshUsers: () => void;
  selectUser: (user: SelectedUserData) => void;
  deselectUser: () => void;
  setUsersSearch: (term: string) => void;
  openRoleChange: (dialog: RoleChangeDialog) => void;
  confirmRoleChange: () => Promise<void>;
  cancelRoleChange: () => void;
  loadProducts: () => void;
  refreshProducts: () => void;
  selectProduct: (productId: string) => void;
  deselectProduct: () => void;
  setProductsSearch: (term: string) => void;
  setProductsStatusFilter: (filter: ProductStatusFilter) => void;
  openProductAction: (dialog: ProductActionDialog) => void;
  confirmProductAction: () => Promise<void>;
  cancelProductAction: () => void;
  loadOrders: () => void;
  refreshOrders: () => void;
  selectOrder: (order: AdminOrder) => void;
  deselectOrder: () => void;
  setOrdersSearch: (term: string) => void;
  setOrdersStatusFilter: (filter: string) => void;
  setOrdersSort: (field: OrderSortField, direction: SortDirection) => void;
  setOrdersPage: (page: number) => void;
  loadSecurity: () => void;
  refreshSecurity: () => void;
  selectAlert: (alert: SecurityAlert) => void;
  deselectAlert: () => void;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  setSecurityFilters: (filters: AlertFilters) => void;
  openBlockDialog: (ip?: string) => void;
  closeBlockDialog: () => void;
  confirmBlockIP: (ip: string, reason: string, expiresInDays?: number) => Promise<void>;
  openUnblockDialog: (blocked: BlockedIP) => void;
  closeUnblockDialog: () => void;
  confirmUnblockIP: () => Promise<void>;
  toggleAutoRefresh: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const { role } = usePermissions();
  const [state, send] = useMachine(adminMachine, { input: { callerRole: role } });

  const doFetchUsers = useCallback(() => fetchUsers(role, send), [role, send]);
  const doFetchProducts = useCallback(() => fetchProducts(state.context.period, send), [state.context.period, send]);
  const doFetchOrders = useCallback(() => fetchOrders(state.context.period, send), [state.context.period, send]);
  const doFetchSecurity = useCallback(() => fetchSecurity(send), [send]);

  // Initial data loading
  useEffect(() => { if (state.context.usersLoading && state.context.users.items.length === 0) doFetchUsers(); }, [state.context.usersLoading, state.context.users.items.length, doFetchUsers]);
  useEffect(() => { if (state.context.productsLoading && state.context.products.items.length === 0) doFetchProducts(); }, [state.context.productsLoading, state.context.products.items.length, doFetchProducts]);
  useEffect(() => { if (state.context.ordersLoading && state.context.orders.items.length === 0) doFetchOrders(); }, [state.context.ordersLoading, state.context.orders.items.length, doFetchOrders]);
  useEffect(() => { if (state.context.securityLoading && state.context.security.alerts.length === 0) doFetchSecurity(); }, [state.context.securityLoading, state.context.security.alerts.length, doFetchSecurity]);

  // Period change reactivity - reload data when period changes
  const prevPeriodRef = useRef(state.context.period);
  useEffect(() => {
    if (prevPeriodRef.current !== state.context.period) {
      prevPeriodRef.current = state.context.period;
      // Reload orders and products when period changes
      if (state.context.orders.items.length > 0) {
        send({ type: "REFRESH_ORDERS" });
        doFetchOrders();
      }
      if (state.context.products.items.length > 0) {
        send({ type: "REFRESH_PRODUCTS" });
        doFetchProducts();
      }
    }
  }, [state.context.period, state.context.orders.items.length, state.context.products.items.length, send, doFetchOrders, doFetchProducts]);

  useEffect(() => {
    if (!state.context.security.autoRefresh) return;
    const interval = setInterval(() => { send({ type: "REFRESH_SECURITY" }); doFetchSecurity(); }, 30000);
    return () => clearInterval(interval);
  }, [state.context.security.autoRefresh, send, doFetchSecurity]);

  const confirmRoleChange = useCallback(() => handleConfirmRoleChange(state.context, send, role), [state.context, send, role]);
  const confirmProductAction = useCallback(() => handleConfirmProductAction(state.context, send, state.context.period), [state.context, send]);
  const acknowledgeAlert = useCallback((alertId: string) => handleAcknowledgeAlert(alertId, send), [send]);
  const confirmBlockIP = useCallback((ip: string, reason: string, expiresInDays?: number) => handleConfirmBlockIP(ip, reason, expiresInDays, send), [send]);
  const confirmUnblockIP = useCallback(() => handleConfirmUnblockIP(state.context, send), [state.context, send]);

  const value: AdminContextValue = {
    context: state.context,
    send,
    isUsersLoading: state.context.usersLoading,
    isProductsLoading: state.context.productsLoading,
    isOrdersLoading: state.context.ordersLoading,
    isSecurityLoading: state.context.securityLoading,
    changeTab: (tab) => send({ type: "CHANGE_TAB", tab }),
    setPeriod: (period) => send({ type: "SET_PERIOD", period }),
    loadUsers: () => { send({ type: "LOAD_USERS" }); doFetchUsers(); },
    refreshUsers: () => { send({ type: "REFRESH_USERS" }); doFetchUsers(); },
    selectUser: (user) => send({ type: "SELECT_USER", user }),
    deselectUser: () => send({ type: "DESELECT_USER" }),
    setUsersSearch: (term) => send({ type: "SET_USERS_SEARCH", term }),
    openRoleChange: (dialog) => send({ type: "OPEN_ROLE_CHANGE", dialog }),
    confirmRoleChange,
    cancelRoleChange: () => send({ type: "CANCEL_ROLE_CHANGE" }),
    loadProducts: () => { send({ type: "LOAD_PRODUCTS" }); doFetchProducts(); },
    refreshProducts: () => { send({ type: "REFRESH_PRODUCTS" }); doFetchProducts(); },
    selectProduct: (productId) => send({ type: "SELECT_PRODUCT", productId }),
    deselectProduct: () => send({ type: "DESELECT_PRODUCT" }),
    setProductsSearch: (term) => send({ type: "SET_PRODUCTS_SEARCH", term }),
    setProductsStatusFilter: (filter) => send({ type: "SET_PRODUCTS_STATUS_FILTER", filter }),
    openProductAction: (dialog) => send({ type: "OPEN_PRODUCT_ACTION", dialog }),
    confirmProductAction,
    cancelProductAction: () => send({ type: "CANCEL_PRODUCT_ACTION" }),
    loadOrders: () => { send({ type: "LOAD_ORDERS" }); doFetchOrders(); },
    refreshOrders: () => { send({ type: "REFRESH_ORDERS" }); doFetchOrders(); },
    selectOrder: (order) => send({ type: "SELECT_ORDER", order }),
    deselectOrder: () => send({ type: "DESELECT_ORDER" }),
    setOrdersSearch: (term) => send({ type: "SET_ORDERS_SEARCH", term }),
    setOrdersStatusFilter: (filter) => send({ type: "SET_ORDERS_STATUS_FILTER", filter }),
    setOrdersSort: (field, direction) => send({ type: "SET_ORDERS_SORT", field, direction }),
    setOrdersPage: (page) => send({ type: "SET_ORDERS_PAGE", page }),
    loadSecurity: () => { send({ type: "LOAD_SECURITY" }); doFetchSecurity(); },
    refreshSecurity: () => { send({ type: "REFRESH_SECURITY" }); doFetchSecurity(); },
    selectAlert: (alert) => send({ type: "SELECT_ALERT", alert }),
    deselectAlert: () => send({ type: "DESELECT_ALERT" }),
    acknowledgeAlert,
    setSecurityFilters: (filters) => send({ type: "SET_SECURITY_FILTERS", filters }),
    openBlockDialog: (ip) => send({ type: "OPEN_BLOCK_DIALOG", ip }),
    closeBlockDialog: () => send({ type: "CLOSE_BLOCK_DIALOG" }),
    confirmBlockIP,
    openUnblockDialog: (blocked) => send({ type: "OPEN_UNBLOCK_DIALOG", blocked }),
    closeUnblockDialog: () => send({ type: "CLOSE_UNBLOCK_DIALOG" }),
    confirmUnblockIP,
    toggleAutoRefresh: () => send({ type: "TOGGLE_AUTO_REFRESH" }),
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used within an AdminProvider");
  return context;
}
