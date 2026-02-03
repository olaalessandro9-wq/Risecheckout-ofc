/**
 * Admin Fetchers - Data Fetching Functions
 * 
 * RISE Protocol V3 - Modularized from AdminContext
 * 
 * @version 2.0.0 - Canonical Order Status via orderStatusService
 */

import { api } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AppRole } from "@/hooks/usePermissions";
import { orderStatusService } from "@/lib/order-status/service";
import { createLogger } from "@/lib/logger";
import type { CanonicalOrderStatus } from "@/lib/order-status/types";
import type { 
  PeriodFilter,
  AdminOrder,
  SecurityAlert,
  BlockedIP,
  SecurityStats,
  UserWithRole,
  ProductWithMetrics,
} from "../types/admin.types";

const log = createLogger("AdminFetchers");

// Send function type (generic to avoid circular dependency)
type SendFn = (event: { type: string; [key: string]: unknown }) => void;

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
  _role: AppRole,
  send: SendFn
): Promise<void> {
  try {
    // RISE V3: Email agora vem direto da tabela users via getUsersWithMetrics
    // Eliminado: get-users-with-emails (consultava auth.users abandonada)
    const usersRes = await api.call<{ users: UserWithRole[] }>("admin-data", { action: "users-with-metrics" });

    if (usersRes.error) throw new Error(usersRes.error.message);

    const users = usersRes.data?.users ?? [];

    // RISE V3: emails já estão incluídos no objeto user
    send({ type: "USERS_LOADED", data: { users, emails: {} } });
  } catch (error) {
    send({ type: "USERS_ERROR", error: error instanceof Error ? error.message : "Erro ao carregar usuários" });
  }
}

// ============================================================================
// PRODUCTS FETCHER
// ============================================================================

export async function fetchProducts(
  _period: PeriodFilter,
  send: SendFn
): Promise<void> {
  try {
    const { data, error } = await api.call<{ products: ProductWithMetrics[] }>(
      "admin-data",
      { action: "admin-products-global" }
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
  amount_cents?: number;
  status?: string;
  payment_method?: string;
  created_at?: string;
  product?: { id?: string; name?: string; image_url?: string; user_id?: string };
  vendor_id?: string;
}

export async function fetchOrders(
  period: PeriodFilter,
  send: SendFn
): Promise<void> {
  try {
    const { data, error } = await api.call<{ orders: RawOrder[] }>(
      "admin-data",
      { action: "admin-orders", period }
    );

    if (error) throw new Error(error.message);

    const rawOrders = data?.orders ?? [];
    
    // === INSTRUMENTATION: Log status distribution from backend ===
    const statusDistribution = rawOrders.reduce((acc, o) => {
      const key = o.status ?? "NULL";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    log.info("Backend status distribution", statusDistribution);

    const orders: AdminOrder[] = rawOrders.map(order => {
      const createdAtRaw = order.created_at || new Date().toISOString();
      const createdAt = new Date(createdAtRaw);
      
      // === CANONICAL NORMALIZATION via orderStatusService ===
      const rawStatus = order.status;
      const normalizedStatus: CanonicalOrderStatus = orderStatusService.normalize(rawStatus);
      
      // Log anomaly if status was empty/null (should be investigated upstream)
      if (!rawStatus) {
        log.warn(`Order ${order.id} has null/empty status, normalized to "${normalizedStatus}"`);
      }
      
      return {
        id: order.id,
        orderId: order.id.slice(0, 8).toUpperCase(),
        customerName: order.customer_name || "Sem nome",
        customerEmail: order.customer_email || "",
        customerPhone: order.customer_phone || "",
        customerDocument: order.customer_document || "",
        productName: order.product?.name || "Produto removido",
        productImageUrl: order.product?.image_url || "",
        productOwnerId: order.product?.user_id || "",
        vendorId: order.vendor_id || "",
        amount: formatCentsToBRL(order.amount_cents || 0),
        amountCents: order.amount_cents || 0,
        status: normalizedStatus,
        paymentMethod: order.payment_method || null,
        createdAt: format(createdAt, "dd/MM/yyyy", { locale: ptBR }),
        fullCreatedAt: format(createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
        createdAtISO: createdAtRaw,
      };
    });

    // === POST-NORMALIZATION: Log mapped distribution ===
    const mappedDistribution = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    log.info("Mapped status distribution", mappedDistribution);

    send({ type: "ORDERS_LOADED", data: orders });
  } catch (error) {
    send({ type: "ORDERS_ERROR", error: error instanceof Error ? error.message : "Erro ao carregar pedidos" });
  }
}

// ============================================================================
// SECURITY FETCHER
// ============================================================================

export async function fetchSecurity(
  send: SendFn
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
