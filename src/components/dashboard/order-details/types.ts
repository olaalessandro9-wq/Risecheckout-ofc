/**
 * Types for OrderDetailsDialog components
 */

import type { CustomerDisplayStatus } from "@/modules/dashboard/types";

export interface OrderData {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDocument: string;
  productName: string;
  productImageUrl: string;
  amount: string;
  status: CustomerDisplayStatus;
  createdAt: string;
}

export interface DecryptedCustomerData {
  customer_phone?: string;
  customer_document?: string;
}

export interface StatusConfig {
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  gradient: string;
}
