import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PeriodFilter } from "@/hooks/useAdminAnalytics";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { formatCentsToBRL } from "@/lib/money";

export interface AdminOrder {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDocument: string;
  productName: string;
  productImageUrl: string;
  productOwnerId: string;
  vendorId: string;
  amount: string;
  amountCents: number;
  status: "Pago" | "Pendente" | "Reembolso" | "Chargeback";
  paymentMethod: string | null;
  createdAt: string;
  fullCreatedAt: string;
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

function translateStatus(status: string): "Pago" | "Pendente" | "Reembolso" | "Chargeback" {
  const statusMap: Record<string, "Pago" | "Pendente" | "Reembolso" | "Chargeback"> = {
    'paid': 'Pago',
    'pending': 'Pendente',
    'refunded': 'Reembolso',
    'chargeback': 'Chargeback'
  };
  return statusMap[status?.toLowerCase()] || 'Pendente';
}

function getDateRange(period: PeriodFilter): { start: Date; end: Date } {
  const now = new Date();
  
  switch (period) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday":
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    case "7days":
      return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
    case "30days":
      return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    case "all":
    default:
      return { start: new Date("2020-01-01"), end: endOfDay(now) };
  }
}

export function useAdminOrders(period: PeriodFilter) {
  return useQuery({
    queryKey: ["admin-orders", period],
    queryFn: async (): Promise<AdminOrder[]> => {
      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: { action: "admin-orders", period },
      });

      if (error) {
        console.error("[useAdminOrders] Erro ao buscar pedidos:", error);
        throw error;
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
          status: translateStatus(order.status as string),
          paymentMethod: order.payment_method as string | null,
          createdAt: formatDate(order.created_at as string),
          fullCreatedAt: order.created_at as string,
        };
      });
    },
    staleTime: 1000 * 60 * 2,
  });
}
