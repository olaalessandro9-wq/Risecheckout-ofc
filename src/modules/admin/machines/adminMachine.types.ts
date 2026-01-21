/**
 * Admin Machine Types
 * 
 * RISE Protocol V3 - XState State Machine Types
 * 
 * @version 1.0.0
 */

import type { AppRole } from "@/hooks/usePermissions";
import type {
  AdminTabId,
  PeriodFilter,
  UserWithRole,
  ProductWithMetrics,
  AdminOrder,
  SecurityAlert,
  BlockedIP,
  SecurityStats,
  SelectedUserData,
  RoleChangeDialog,
  ProductActionDialog,
  AlertFilters,
  SortDirection,
  OrderSortField,
  ProductStatusFilter,
} from "../types/admin.types";

// Re-export for convenience
export type { AdminTabId, PeriodFilter } from "../types/admin.types";

// ============================================================================
// REGION CONTEXTS
// ============================================================================

export interface UsersRegionContext {
  items: UserWithRole[];
  emailsMap: Record<string, string>;
  selectedUser: SelectedUserData | null;
  roleChangeDialog: RoleChangeDialog | null;
  searchTerm: string;
  error: string | null;
}

export interface ProductsRegionContext {
  items: ProductWithMetrics[];
  selectedProductId: string | null;
  actionDialog: ProductActionDialog | null;
  searchTerm: string;
  statusFilter: ProductStatusFilter;
  error: string | null;
}

export interface OrdersRegionContext {
  items: AdminOrder[];
  selectedOrder: AdminOrder | null;
  searchTerm: string;
  statusFilter: string;
  sortField: OrderSortField;
  sortDirection: SortDirection;
  currentPage: number;
  itemsPerPage: number;
  error: string | null;
}

export interface SecurityRegionContext {
  alerts: SecurityAlert[];
  blockedIPs: BlockedIP[];
  stats: SecurityStats | null;
  selectedAlert: SecurityAlert | null;
  filters: AlertFilters;
  blockDialogOpen: boolean;
  blockDialogIP: string;
  unblockDialogOpen: boolean;
  unblockDialogIP: BlockedIP | null;
  autoRefresh: boolean;
  error: string | null;
}

// ============================================================================
// MAIN CONTEXT
// ============================================================================

export interface AdminMachineContext {
  // Global state
  activeTab: AdminTabId;
  period: PeriodFilter;
  callerRole: AppRole;
  
  // Loading states (simpler than parallel)
  usersLoading: boolean;
  productsLoading: boolean;
  ordersLoading: boolean;
  securityLoading: boolean;
  
  // Region contexts
  users: UsersRegionContext;
  products: ProductsRegionContext;
  orders: OrdersRegionContext;
  security: SecurityRegionContext;
}

// ============================================================================
// EVENTS
// ============================================================================

// Navigation events
export type NavigationEvent =
  | { type: "CHANGE_TAB"; tab: AdminTabId }
  | { type: "SET_PERIOD"; period: PeriodFilter };

// Users region events
export type UsersEvent =
  | { type: "LOAD_USERS" }
  | { type: "REFRESH_USERS" }
  | { type: "USERS_LOADED"; data: { users: UserWithRole[]; emails: Record<string, string> } }
  | { type: "USERS_ERROR"; error: string }
  | { type: "SELECT_USER"; user: SelectedUserData }
  | { type: "DESELECT_USER" }
  | { type: "SET_USERS_SEARCH"; term: string }
  | { type: "OPEN_ROLE_CHANGE"; dialog: RoleChangeDialog }
  | { type: "CONFIRM_ROLE_CHANGE" }
  | { type: "ROLE_CHANGE_SUCCESS" }
  | { type: "ROLE_CHANGE_ERROR"; error: string }
  | { type: "CANCEL_ROLE_CHANGE" };

// Products region events
export type ProductsEvent =
  | { type: "LOAD_PRODUCTS" }
  | { type: "REFRESH_PRODUCTS" }
  | { type: "PRODUCTS_LOADED"; data: ProductWithMetrics[] }
  | { type: "PRODUCTS_ERROR"; error: string }
  | { type: "SELECT_PRODUCT"; productId: string }
  | { type: "DESELECT_PRODUCT" }
  | { type: "SET_PRODUCTS_SEARCH"; term: string }
  | { type: "SET_PRODUCTS_STATUS_FILTER"; filter: ProductStatusFilter }
  | { type: "OPEN_PRODUCT_ACTION"; dialog: ProductActionDialog }
  | { type: "CONFIRM_PRODUCT_ACTION" }
  | { type: "PRODUCT_ACTION_SUCCESS" }
  | { type: "PRODUCT_ACTION_ERROR"; error: string }
  | { type: "CANCEL_PRODUCT_ACTION" };

// Orders region events
export type OrdersEvent =
  | { type: "LOAD_ORDERS" }
  | { type: "REFRESH_ORDERS" }
  | { type: "ORDERS_LOADED"; data: AdminOrder[] }
  | { type: "ORDERS_ERROR"; error: string }
  | { type: "SELECT_ORDER"; order: AdminOrder }
  | { type: "DESELECT_ORDER" }
  | { type: "SET_ORDERS_SEARCH"; term: string }
  | { type: "SET_ORDERS_STATUS_FILTER"; filter: string }
  | { type: "SET_ORDERS_SORT"; field: OrderSortField; direction: SortDirection }
  | { type: "SET_ORDERS_PAGE"; page: number };

// Security region events
export type SecurityEvent =
  | { type: "LOAD_SECURITY" }
  | { type: "REFRESH_SECURITY" }
  | { type: "SECURITY_LOADED"; data: { alerts: SecurityAlert[]; blockedIPs: BlockedIP[]; stats: SecurityStats | null } }
  | { type: "SECURITY_ERROR"; error: string }
  | { type: "SELECT_ALERT"; alert: SecurityAlert }
  | { type: "DESELECT_ALERT" }
  | { type: "ACKNOWLEDGE_ALERT"; alertId: string }
  | { type: "ALERT_ACKNOWLEDGED" }
  | { type: "SET_SECURITY_FILTERS"; filters: AlertFilters }
  | { type: "OPEN_BLOCK_DIALOG"; ip?: string }
  | { type: "CLOSE_BLOCK_DIALOG" }
  | { type: "CONFIRM_BLOCK_IP"; ip: string; reason: string; expiresInDays?: number }
  | { type: "BLOCK_IP_SUCCESS" }
  | { type: "OPEN_UNBLOCK_DIALOG"; blocked: BlockedIP }
  | { type: "CLOSE_UNBLOCK_DIALOG" }
  | { type: "CONFIRM_UNBLOCK_IP" }
  | { type: "UNBLOCK_IP_SUCCESS" }
  | { type: "TOGGLE_AUTO_REFRESH" };

// Combined events
export type AdminMachineEvent =
  | NavigationEvent
  | UsersEvent
  | ProductsEvent
  | OrdersEvent
  | SecurityEvent;

// ============================================================================
// ACTOR INPUT TYPES
// ============================================================================

export interface LoadUsersInput {
  callerRole: AppRole;
}

export interface LoadUsersOutput {
  users: UserWithRole[];
  emails: Record<string, string>;
}

export interface ChangeRoleInput {
  userId: string;
  newRole: AppRole;
}

export interface LoadProductsInput {
  period: PeriodFilter;
}

export interface ProductActionInput {
  productId: string;
  action: "activate" | "block" | "delete";
}

export interface LoadOrdersInput {
  period: PeriodFilter;
}

export interface LoadSecurityInput {
  period?: PeriodFilter;
}

export interface LoadSecurityOutput {
  alerts: SecurityAlert[];
  blockedIPs: BlockedIP[];
  stats: SecurityStats | null;
}

export interface AcknowledgeAlertInput {
  alertId: string;
}

export interface BlockIPInput {
  ip: string;
  reason: string;
  expiresInDays?: number;
}

export interface UnblockIPInput {
  ip: string;
}

// ============================================================================
// INITIAL CONTEXT
// ============================================================================

export const initialUsersContext: UsersRegionContext = {
  items: [],
  emailsMap: {},
  selectedUser: null,
  roleChangeDialog: null,
  searchTerm: "",
  error: null,
};

export const initialProductsContext: ProductsRegionContext = {
  items: [],
  selectedProductId: null,
  actionDialog: null,
  searchTerm: "",
  statusFilter: "all",
  error: null,
};

export const initialOrdersContext: OrdersRegionContext = {
  items: [],
  selectedOrder: null,
  searchTerm: "",
  statusFilter: "all",
  sortField: "date",
  sortDirection: "desc",
  currentPage: 1,
  itemsPerPage: 20,
  error: null,
};

export const initialSecurityContext: SecurityRegionContext = {
  alerts: [],
  blockedIPs: [],
  stats: null,
  selectedAlert: null,
  filters: {},
  blockDialogOpen: false,
  blockDialogIP: "",
  unblockDialogOpen: false,
  unblockDialogIP: null,
  autoRefresh: false,
  error: null,
};

export const createInitialContext = (callerRole: AppRole): AdminMachineContext => ({
  activeTab: "finance",
  period: "7days",
  callerRole,
  usersLoading: false,
  productsLoading: false,
  ordersLoading: false,
  securityLoading: false,
  users: initialUsersContext,
  products: initialProductsContext,
  orders: initialOrdersContext,
  security: initialSecurityContext,
});
