/**
 * Orders Actors - Data Fetching for Orders Region
 * 
 * RISE Protocol V3 - XState Actors
 * 
 * @version 1.0.0
 */

import { fromPromise } from "xstate";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { LoadOrdersInput } from "../adminMachine.types";
import type { AdminOrder } from "../../types/admin.types";

const log = createLogger("AdminOrdersActors");

// ============================================================================
// HELPERS
// ============================================================================

function formatCentsToBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

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
  products?: {
    id?: string;
    name?: string;
    image_url?: string;
    user_id?: string;
  };
  vendor_id?: string;
}

function mapOrderToAdminOrder(order: RawOrder): AdminOrder {
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
}

// ============================================================================
// LOAD ORDERS ACTOR
// ============================================================================

export const loadOrdersActor = fromPromise<AdminOrder[], LoadOrdersInput>(
  async ({ input }) => {
    log.info("Loading admin orders", { period: input.period });

    const { data, error } = await api.call<{ orders: RawOrder[] }>(
      "admin-data",
      {
        action: "orders-list",
        period: input.period,
      }
    );

    if (error) {
      log.error("Failed to load orders", { error: error.message });
      throw new Error(error.message || "Erro ao carregar pedidos");
    }

    const rawOrders = data?.orders ?? [];
    const orders = rawOrders.map(mapOrderToAdminOrder);

    log.info("Orders loaded successfully", { count: orders.length });

    return orders;
  }
);
