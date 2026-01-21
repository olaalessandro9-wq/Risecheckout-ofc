/**
 * Admin Fetchers - Data Fetching Functions
 * 
 * RISE Protocol V3 - Modularized from AdminContext
 * 
 * @version 1.0.0
 */

import { api } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AppRole } from "@/hooks/usePermissions";
import type { AdminMachineEvent } from "../machines/adminMachine.types";
import type { 
  PeriodFilter,
  AdminOrder,
  SecurityAlert,
  BlockedIP,
  SecurityStats,
  UserWithRole,
  ProductWithMetrics,
} from "../types/admin.types";

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
// USERS FETCHER
// ============================================================================

export async function fetchUsers(
  role: AppRole,
  send: (event: AdminMachineEvent) => void
): Promise<void> {
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
}

// ============================================================================
// PRODUCTS FETCHER
// ============================================================================

export async function fetchProducts(
  period: PeriodFilter,
  send: (event: AdminMachineEvent) => void
): Promise<void> {
  try {
    const { data, error } = await api.call<{ products: ProductWithMetrics[] }>(
      "admin-data",
      { action: "products-with-metrics", period }
    );

    if (error) throw new Error(error.message);
    send({ type: "PRODUCTS_LOADED", data: data?.products ?? [] });
  } catch (error) {
    send({ type: "PRODUCTS_ERROR", error: error instanceof Error ? error.message : "Erro ao carregar produtos" });
  }
}

// ============================================================================
// ORDERS FETCHER
// ============================================================================

interface RawOrder {
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
}

export async function fetchOrders(
  period: PeriodFilter,
  send: (event: AdminMachineEvent) => void
): Promise<void> {
  try {
    const { data, error } = await api.call<{ orders: RawOrder[] }>(
      "admin-data",
      { action: "orders-list", period }
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
}

// ============================================================================
// SECURITY FETCHER
// ============================================================================

export async function fetchSecurity(
  send: (event: AdminMachineEvent) => void
): Promise<void> {
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
}
