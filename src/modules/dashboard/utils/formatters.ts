/**
 * Funções de formatação para o Dashboard
 * 
 * @module dashboard/utils
 * @version RISE V3 Compliant
 */

import type { Order, RecentCustomer } from "../types";
import { formatCentsToBRL } from "@/lib/money";

// Re-export para manter compatibilidade
export const formatCurrency = formatCentsToBRL;

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================================
// STATUS TRANSLATOR
// ============================================================================

export function translateStatus(
  status: string
): "Pago" | "Pendente" | "Reembolso" | "Chargeback" {
  const statusMap: Record<
    string,
    "Pago" | "Pendente" | "Reembolso" | "Chargeback"
  > = {
    paid: "Pago",
    pending: "Pendente",
    refunded: "Reembolso",
    chargeback: "Chargeback",
  };
  return statusMap[status?.toLowerCase()] || "Pendente";
}

// ============================================================================
// DOCUMENT FORMATTER
// ============================================================================

export function formatDocument(doc: string | null): string {
  if (!doc) return "N/A";
  const digits = doc.replace(/\D/g, "");
  if (digits.length === 11) {
    // CPF: 000.000.000-00
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  } else if (digits.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  }
  return doc;
}

// ============================================================================
// RECENT CUSTOMERS FORMATTER
// ============================================================================

export function formatRecentCustomers(orders: Order[]): RecentCustomer[] {
  return orders.map((order) => {
    const product = Array.isArray(order.product)
      ? order.product[0]
      : order.product;

    return {
      id: order.id.substring(0, 8),
      orderId: order.id,
      offer: product?.name || "Produto não encontrado",
      client: order.customer_name || "N/A",
      phone: order.customer_phone || "N/A",
      email: order.customer_email || "N/A",
      createdAt: formatDate(order.created_at),
      value: formatCurrency(order.amount_cents || 0),
      status: translateStatus(order.status),
      productName: product?.name || "Produto não encontrado",
      productImageUrl: product?.image_url || "",
      productOwnerId: product?.user_id || "",
      customerName: order.customer_name || "N/A",
      customerEmail: order.customer_email || "N/A",
      customerPhone: order.customer_phone || "N/A",
      customerDocument: formatDocument(order.customer_document),
      fullCreatedAt: order.created_at,
    };
  });
}
