/**
 * Funções de formatação para o Dashboard
 * 
 * @module dashboard/utils
 * @version 3.0.0 - RISE V3 Compliant (Solution C - Canonical Status)
 */

import type { Order, RecentCustomer } from "../types";
import { formatCentsToBRL } from "@/lib/money";
import { timezoneService } from "@/lib/timezone";
import { orderStatusService } from "@/lib/order-status";

// Re-export para manter compatibilidade
export const formatCurrency = formatCentsToBRL;

/**
 * Formata uma data para exibição no timezone de São Paulo
 * 
 * Uses TimezoneService to ensure dates are displayed
 * in the vendor's timezone, not UTC.
 */
export function formatDate(dateString: string): string {
  return timezoneService.formatFull(dateString);
}

// ============================================================================
// STATUS TRANSLATOR (Using OrderStatusService)
// ============================================================================

import type { CustomerDisplayStatus } from "../types";

/**
 * Traduz o status do pedido para exibição
 * 
 * IMPORTANTE: Agora usa OrderStatusService para normalização.
 * Não há mais fallback para "Pendente" - status desconhecidos
 * aparecem como "Desconhecido".
 * 
 * @param status - Status do pedido (canônico ou de gateway)
 * @returns Label traduzido para PT-BR
 */
export function translateStatus(status: string): CustomerDisplayStatus {
  return orderStatusService.getDisplayLabel(status) as CustomerDisplayStatus;
}

/**
 * Retorna o esquema de cores para um status
 * Uso em badges e indicadores visuais
 */
export function getStatusColors(status: string) {
  return orderStatusService.getColorScheme(status);
}

/**
 * Verifica se o status representa um pagamento concluído
 */
export function isStatusPaid(status: string): boolean {
  return orderStatusService.isPaid(status);
}

/**
 * Verifica se o status representa um pagamento pendente
 */
export function isStatusPending(status: string): boolean {
  return orderStatusService.isPending(status);
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
      // Preservar status raw para debugging/diagnóstico
      statusRaw: order.status,
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
