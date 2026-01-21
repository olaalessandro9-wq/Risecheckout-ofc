/**
 * useAdminOrders
 * 
 * @version 3.0.0 - RISE Protocol V3 - Zero duplicações
 * MIGRATED: Uses api.call() instead of supabase.functions.invoke
 * MIGRATED: Uses centralized AdminOrder type from admin.types
 * MIGRATED: Uses orderStatusService for status translation
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import { PeriodFilter } from "@/hooks/useAdminAnalytics";
import { formatCentsToBRL } from "@/lib/money";
import { orderStatusService } from "@/lib/order-status";
import type { AdminOrder } from "@/modules/admin/types/admin.types";

const log = createLogger("AdminOrders");

interface AdminOrdersResponse {
  orders?: Array<Record<string, unknown>>;
  error?: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function useAdminOrders(period: PeriodFilter) {
  return useQuery({
    queryKey: ["admin-orders", period],
    queryFn: async (): Promise<AdminOrder[]> => {
      const { data, error } = await api.call<AdminOrdersResponse>("admin-data", {
        action: "admin-orders",
        period,
      });

      if (error) {
        log.error("Erro ao buscar pedidos:", error);
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return (data?.orders || []).map((order: Record<string, unknown>) => {
        const product = Array.isArray(order.product) ? order.product[0] : order.product;
        
        return {
          id: (order.id as string).substring(0, 8),
          orderId: order.id as string,
          customerName: (order.customer_name as string) || "N/A",
          customerEmail: (order.customer_email as string) || "N/A",
          customerPhone: (order.customer_phone as string) || "N/A",
          customerDocument: (order.customer_document as string) || "N/A",
          productName: product?.name || "Produto não encontrado",
          productImageUrl: product?.image_url || "",
          productOwnerId: product?.user_id || "",
          vendorId: order.vendor_id as string,
          amount: formatCentsToBRL((order.amount_cents as number) || 0),
          amountCents: (order.amount_cents as number) || 0,
          status: orderStatusService.getDisplayLabel(order.status as string),
          paymentMethod: order.payment_method as string | null,
          createdAt: formatDate(order.created_at as string),
          fullCreatedAt: order.created_at as string,
        };
      });
    },
    staleTime: 1000 * 60 * 2,
  });
}

// Re-export AdminOrder type for backward compatibility
export type { AdminOrder };
