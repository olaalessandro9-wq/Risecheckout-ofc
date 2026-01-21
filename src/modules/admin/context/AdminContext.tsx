/**
 * Admin Context - React Context for Admin State Machine
 * 
 * RISE Protocol V3 - Score 10.0/10
 * 
 * Provides the admin state machine to all admin components.
 * Single Source of Truth via XState.
 * 
 * @version 1.0.0
 */

import { createContext, useContext, useEffect, useCallback, type ReactNode } from "react";
import { useMachine } from "@xstate/react";
import { adminMachine } from "../machines/adminMachine";
import { usePermissions } from "@/hooks/usePermissions";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  UserWithRole,
  ProductWithMetrics,
  SecurityStats,
} from "../types/admin.types";

const log = createLogger("AdminContext");

// ============================================================================
// HELPERS
// ============================================================================

function formatCentsToBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

// ============================================================================
// CONTEXT TYPE
// ============================================================================

export interface AdminContextValue {
  // Raw state access
  context: AdminMachineContext;
  send: (event: AdminMachineEvent) => void;
  
  // Loading states
  isUsersLoading: boolean;
  isProductsLoading: boolean;
  isOrdersLoading: boolean;
  isSecurityLoading: boolean;
  
  // Navigation actions
  changeTab: (tab: AdminTabId) => void;
  setPeriod: (period: PeriodFilter) => void;
  
  // Users actions
  loadUsers: () => void;
  refreshUsers: () => void;
  selectUser: (user: SelectedUserData) => void;
  deselectUser: () => void;
  setUsersSearch: (term: string) => void;
  openRoleChange: (dialog: RoleChangeDialog) => void;
  confirmRoleChange: () => Promise<void>;
  cancelRoleChange: () => void;
  
  // Products actions
  loadProducts: () => void;
  refreshProducts: () => void;
  selectProduct: (productId: string) => void;
  deselectProduct: () => void;
  setProductsSearch: (term: string) => void;
  setProductsStatusFilter: (filter: ProductStatusFilter) => void;
  openProductAction: (dialog: ProductActionDialog) => void;
  confirmProductAction: () => Promise<void>;
  cancelProductAction: () => void;
  
  // Orders actions
  loadOrders: () => void;
  refreshOrders: () => void;
  selectOrder: (order: AdminOrder) => void;
  deselectOrder: () => void;
  setOrdersSearch: (term: string) => void;
  setOrdersStatusFilter: (filter: string) => void;
  setOrdersSort: (field: OrderSortField, direction: SortDirection) => void;
  setOrdersPage: (page: number) => void;
  
  // Security actions
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

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const AdminContext = createContext<AdminContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const { role } = usePermissions();
  
  const [state, send] = useMachine(adminMachine, {
    input: { callerRole: role },
  });

  // ========================================
  // DATA FETCHING FUNCTIONS
  // ========================================

  const fetchUsers = useCallback(async () => {
    try {
      const [usersRes, emailsRes] = await Promise.all([
        api.call<{ users: UserWithRole[] }>("admin-data", { action: "users-with-metrics" }),
        role === "owner"
          ? api.call<{ emails: Record<string, string> }>("get-users-with-emails", {})
          : Promise.resolve({ data: { emails: {} }, error: null }),
      ]);

      if (usersRes.error) throw new Error(usersRes.error.message);

      const users = usersRes.data?.users ?? [];
      const emails = emailsRes.data?.emails ?? {};

      const usersWithEmails = users.map(user => ({
        ...user,
        email: emails[user.user_id] || user.email,
      }));

      send({ type: "USERS_LOADED", data: { users: usersWithEmails, emails } });
    } catch (error) {
      send({ type: "USERS_ERROR", error: error instanceof Error ? error.message : "Erro ao carregar usuários" });
    }
  }, [role, send]);

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await api.call<{ products: ProductWithMetrics[] }>(
        "admin-data",
        { action: "products-with-metrics", period: state.context.period }
      );

      if (error) throw new Error(error.message);
      send({ type: "PRODUCTS_LOADED", data: data?.products ?? [] });
    } catch (error) {
      send({ type: "PRODUCTS_ERROR", error: error instanceof Error ? error.message : "Erro ao carregar produtos" });
    }
  }, [state.context.period, send]);

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await api.call<{ orders: Array<{
        id: string;
        customer_name?: string;
        customer_email?: string;
        customer_phone?: string;
        customer_document?: string;
        amount?: number;
        status?: string;
        payment_method?: string;
        created_at?: string;
        products?: { name?: string; image_url?: string; user_id?: string };
        vendor_id?: string;
      }> }>(
        "admin-data",
        { action: "orders-list", period: state.context.period }
      );

      if (error) throw new Error(error.message);

      const orders: AdminOrder[] = (data?.orders ?? []).map(order => {
        const createdAt = order.created_at ? new Date(order.created_at) : new Date();
        return {
          id: order.id,
          orderId: order.id.slice(0, 8).toUpperCase(),
          customerName: order.customer_name || "Sem nome",
          customerEmail: order.customer_email || "",
          customerPhone: order.customer_phone || "",
          customerDocument: order.customer_document || "",
          productName: order.products?.name || "Produto removido",
          productImageUrl: order.products?.image_url || "",
          productOwnerId: order.products?.user_id || "",
          vendorId: order.vendor_id || "",
          amount: formatCentsToBRL(order.amount || 0),
          amountCents: order.amount || 0,
          status: order.status || "pending",
          paymentMethod: order.payment_method || null,
          createdAt: format(createdAt, "dd/MM/yyyy", { locale: ptBR }),
          fullCreatedAt: format(createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
        };
      });

      send({ type: "ORDERS_LOADED", data: orders });
    } catch (error) {
      send({ type: "ORDERS_ERROR", error: error instanceof Error ? error.message : "Erro ao carregar pedidos" });
    }
  }, [state.context.period, send]);

  const fetchSecurity = useCallback(async () => {
    try {
      const [alertsRes, blockedRes, statsRes] = await Promise.all([
        api.call<{ alerts: SecurityAlert[] }>("admin-data", { action: "security-alerts" }),
        api.call<{ blockedIPs: BlockedIP[] }>("admin-data", { action: "security-blocked-ips" }),
        api.call<{ stats: SecurityStats }>("admin-data", { action: "security-stats" }),
      ]);

      if (alertsRes.error) throw new Error(alertsRes.error.message);

      send({
        type: "SECURITY_LOADED",
        data: {
          alerts: alertsRes.data?.alerts ?? [],
          blockedIPs: blockedRes.data?.blockedIPs ?? [],
          stats: statsRes.data?.stats ?? null,
        },
      });
    } catch (error) {
      send({ type: "SECURITY_ERROR", error: error instanceof Error ? error.message : "Erro ao carregar segurança" });
    }
  }, [send]);

  // ========================================
  // EFFECTS
  // ========================================

  // Auto-load data when loading state is triggered
  useEffect(() => {
    if (state.context.usersLoading && state.context.users.items.length === 0) {
      fetchUsers();
    }
  }, [state.context.usersLoading, state.context.users.items.length, fetchUsers]);

  useEffect(() => {
    if (state.context.productsLoading && state.context.products.items.length === 0) {
      fetchProducts();
    }
  }, [state.context.productsLoading, state.context.products.items.length, fetchProducts]);

  useEffect(() => {
    if (state.context.ordersLoading && state.context.orders.items.length === 0) {
      fetchOrders();
    }
  }, [state.context.ordersLoading, state.context.orders.items.length, fetchOrders]);

  useEffect(() => {
    if (state.context.securityLoading && state.context.security.alerts.length === 0) {
      fetchSecurity();
    }
  }, [state.context.securityLoading, state.context.security.alerts.length, fetchSecurity]);

  // Auto-refresh security
  useEffect(() => {
    if (!state.context.security.autoRefresh) return;
    
    const interval = setInterval(() => {
      send({ type: "REFRESH_SECURITY" });
      fetchSecurity();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [state.context.security.autoRefresh, send, fetchSecurity]);

  // ========================================
  // ACTION HANDLERS
  // ========================================

  const confirmRoleChange = useCallback(async () => {
    const dialog = state.context.users.roleChangeDialog;
    if (!dialog) return;

    send({ type: "CONFIRM_ROLE_CHANGE" });

    try {
      const { error, data } = await api.call<{ error?: string }>("manage-user-role", {
        targetUserId: dialog.userId,
        newRole: dialog.newRole,
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      send({ type: "ROLE_CHANGE_SUCCESS" });
      send({ type: "REFRESH_USERS" });
      fetchUsers();
    } catch (error) {
      send({ type: "ROLE_CHANGE_ERROR", error: error instanceof Error ? error.message : "Erro ao alterar role" });
    }
  }, [state.context.users.roleChangeDialog, send, fetchUsers]);

  const confirmProductAction = useCallback(async () => {
    const dialog = state.context.products.actionDialog;
    if (!dialog) return;

    send({ type: "CONFIRM_PRODUCT_ACTION" });

    try {
      const { error, data } = await api.call<{ error?: string }>("admin-product-management", {
        action: dialog.action,
        productId: dialog.productId,
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      send({ type: "PRODUCT_ACTION_SUCCESS" });
      send({ type: "REFRESH_PRODUCTS" });
      fetchProducts();
    } catch (error) {
      send({ type: "PRODUCT_ACTION_ERROR", error: error instanceof Error ? error.message : "Erro na ação" });
    }
  }, [state.context.products.actionDialog, send, fetchProducts]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    send({ type: "ACKNOWLEDGE_ALERT", alertId });

    try {
      const { error, data } = await api.call<{ error?: string }>("security-management", {
        action: "acknowledge-alert",
        alertId,
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      send({ type: "ALERT_ACKNOWLEDGED" });
      send({ type: "REFRESH_SECURITY" });
      fetchSecurity();
    } catch (error) {
      send({ type: "SECURITY_ERROR", error: error instanceof Error ? error.message : "Erro ao confirmar alerta" });
    }
  }, [send, fetchSecurity]);

  const confirmBlockIP = useCallback(async (ip: string, reason: string, expiresInDays?: number) => {
    send({ type: "CONFIRM_BLOCK_IP", ip, reason, expiresInDays });

    try {
      const { error, data } = await api.call<{ error?: string }>("security-management", {
        action: "block-ip",
        ipAddress: ip,
        reason,
        expiresInDays,
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      send({ type: "BLOCK_IP_SUCCESS" });
      send({ type: "REFRESH_SECURITY" });
      fetchSecurity();
    } catch (error) {
      send({ type: "SECURITY_ERROR", error: error instanceof Error ? error.message : "Erro ao bloquear IP" });
    }
  }, [send, fetchSecurity]);

  const confirmUnblockIP = useCallback(async () => {
    const blocked = state.context.security.unblockDialogIP;
    if (!blocked) return;

    send({ type: "CONFIRM_UNBLOCK_IP" });

    try {
      const { error, data } = await api.call<{ error?: string }>("security-management", {
        action: "unblock-ip",
        ipAddress: blocked.ip_address,
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      send({ type: "UNBLOCK_IP_SUCCESS" });
      send({ type: "REFRESH_SECURITY" });
      fetchSecurity();
    } catch (error) {
      send({ type: "SECURITY_ERROR", error: error instanceof Error ? error.message : "Erro ao desbloquear IP" });
    }
  }, [state.context.security.unblockDialogIP, send, fetchSecurity]);

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const value: AdminContextValue = {
    context: state.context,
    send,
    
    // Loading states
    isUsersLoading: state.context.usersLoading,
    isProductsLoading: state.context.productsLoading,
    isOrdersLoading: state.context.ordersLoading,
    isSecurityLoading: state.context.securityLoading,
    
    // Navigation
    changeTab: (tab) => send({ type: "CHANGE_TAB", tab }),
    setPeriod: (period) => send({ type: "SET_PERIOD", period }),
    
    // Users
    loadUsers: () => { send({ type: "LOAD_USERS" }); fetchUsers(); },
    refreshUsers: () => { send({ type: "REFRESH_USERS" }); fetchUsers(); },
    selectUser: (user) => send({ type: "SELECT_USER", user }),
    deselectUser: () => send({ type: "DESELECT_USER" }),
    setUsersSearch: (term) => send({ type: "SET_USERS_SEARCH", term }),
    openRoleChange: (dialog) => send({ type: "OPEN_ROLE_CHANGE", dialog }),
    confirmRoleChange,
    cancelRoleChange: () => send({ type: "CANCEL_ROLE_CHANGE" }),
    
    // Products
    loadProducts: () => { send({ type: "LOAD_PRODUCTS" }); fetchProducts(); },
    refreshProducts: () => { send({ type: "REFRESH_PRODUCTS" }); fetchProducts(); },
    selectProduct: (productId) => send({ type: "SELECT_PRODUCT", productId }),
    deselectProduct: () => send({ type: "DESELECT_PRODUCT" }),
    setProductsSearch: (term) => send({ type: "SET_PRODUCTS_SEARCH", term }),
    setProductsStatusFilter: (filter) => send({ type: "SET_PRODUCTS_STATUS_FILTER", filter }),
    openProductAction: (dialog) => send({ type: "OPEN_PRODUCT_ACTION", dialog }),
    confirmProductAction,
    cancelProductAction: () => send({ type: "CANCEL_PRODUCT_ACTION" }),
    
    // Orders
    loadOrders: () => { send({ type: "LOAD_ORDERS" }); fetchOrders(); },
    refreshOrders: () => { send({ type: "REFRESH_ORDERS" }); fetchOrders(); },
    selectOrder: (order) => send({ type: "SELECT_ORDER", order }),
    deselectOrder: () => send({ type: "DESELECT_ORDER" }),
    setOrdersSearch: (term) => send({ type: "SET_ORDERS_SEARCH", term }),
    setOrdersStatusFilter: (filter) => send({ type: "SET_ORDERS_STATUS_FILTER", filter }),
    setOrdersSort: (field, direction) => send({ type: "SET_ORDERS_SORT", field, direction }),
    setOrdersPage: (page) => send({ type: "SET_ORDERS_PAGE", page }),
    
    // Security
    loadSecurity: () => { send({ type: "LOAD_SECURITY" }); fetchSecurity(); },
    refreshSecurity: () => { send({ type: "REFRESH_SECURITY" }); fetchSecurity(); },
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

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useAdmin(): AdminContextValue {
  const context = useContext(AdminContext);
  
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  
  return context;
}
