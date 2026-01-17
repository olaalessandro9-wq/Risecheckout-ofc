/**
 * Tipos compartilhados para o módulo de clientes recentes
 * 
 * RISE ARCHITECT PROTOCOL:
 * - Single Source of Truth: Todos os tipos em um lugar
 */

import type { CustomerDisplayStatus } from "@/modules/dashboard/types";

export interface Customer {
  id: string;
  orderId: string;
  offer: string;
  client: string;
  phone: string;
  email: string;
  createdAt: string;
  value: string;
  status: CustomerDisplayStatus;
  statusRaw?: string;
  productName: string;
  productImageUrl: string;
  productOwnerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDocument: string;
  fullCreatedAt: string;
}

export interface CustomerExportData {
  id: string;
  offer: string;
  client: string;
  email: string;
  phone: string;
  createdAt: string;
  value: string;
  status: string;
}
