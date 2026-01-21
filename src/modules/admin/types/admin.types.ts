/**
 * Admin Module Types - Tipos Centralizados
 * 
 * RISE Protocol V3 - Single Source of Truth para tipos do módulo Admin
 * 
 * @version 1.0.0
 */

import type { AppRole } from "@/hooks/usePermissions";

// ============================================
// ENUMS E CONSTANTES
// ============================================

export type AdminTabId = 
  | "finance" 
  | "traffic" 
  | "overview" 
  | "users" 
  | "products" 
  | "orders" 
  | "system" 
  | "security" 
  | "logs";

export type PeriodFilter = "today" | "yesterday" | "7days" | "30days" | "all";

export type SortDirection = "asc" | "desc";

export type UserSortField = "name" | "gmv" | "orders";
export type ProductSortField = "name" | "gmv" | "orders" | "price" | "date";
export type OrderSortField = "date" | "amount" | "customer";

export type UserStatusFilter = "all" | "active" | "suspended" | "banned";
export type ProductStatusFilter = "all" | "active" | "blocked" | "deleted";

// ============================================
// USER TYPES
// ============================================

export interface UserWithRole {
  user_id: string;
  role: AppRole;
  profile: {
    name: string;
  } | null;
  email?: string;
  total_gmv: number;
  total_fees: number;
  orders_count: number;
  registration_source?: string;
}

export interface UserProfile {
  status?: string;
  custom_fee_percent?: number | null;
  created_at?: string;
  status_reason?: string;
}

export interface UserProduct {
  id: string;
  name: string;
  status: string | null;
  price: number;
  total_gmv: number;
  orders_count: number;
}

export interface RoleStats {
  role: string;
  count: number;
}

// ============================================
// PRODUCT TYPES
// ============================================

export interface ProductWithMetrics {
  id: string;
  name: string;
  price: number;
  status: string | null;
  created_at: string | null;
  user_id: string | null;
  vendor_name: string | null;
  total_gmv: number;
  orders_count: number;
}

export interface ProductDetails {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  status: string | null;
  support_name: string | null;
  support_email: string | null;
  created_at: string | null;
  user_id: string | null;
}

export interface ProductOffer {
  id: string;
  name: string;
  price: number;
  status: string;
  is_default: boolean | null;
}

// ============================================
// ORDER TYPES
// ============================================

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
  status: string;
  paymentMethod: string | null;
  createdAt: string;
  fullCreatedAt: string;
}

// ============================================
// SECURITY TYPES
// ============================================

export interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  ip_address: string | null;
  details: Record<string, unknown>;
  acknowledged: boolean;
  created_at: string;
}

export interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  expires_at: string | null;
  block_count: number;
}

export interface SecurityStats {
  criticalAlerts24h: number;
  blockedIPsActive: number;
  bruteForceAttempts: number;
  rateLimitExceeded: number;
  unacknowledgedAlerts: number;
}

export interface AlertFilters {
  type: string;
  severity: string;
  acknowledged: string;
}

// ============================================
// ACTION DIALOG TYPES
// ============================================

export interface RoleChangeDialog {
  open: boolean;
  userId: string;
  userName: string;
  currentRole: AppRole;
  newRole: AppRole;
}

export interface UserActionDialog {
  open: boolean;
  type: "suspend" | "ban" | "activate" | "updateFee" | "resetFee" | "productAction";
  productId?: string;
  productName?: string;
  productAction?: "activate" | "block" | "delete";
}

export interface ProductActionDialog {
  open: boolean;
  productId: string;
  productName: string;
  action: "activate" | "block" | "delete";
}

// ============================================
// SELECTED USER TYPE
// ============================================

export interface SelectedUserData {
  userId: string;
  userName: string;
  userEmail?: string;
  userRole: AppRole;
  totalGmv: number;
  totalFees: number;
  ordersCount: number;
}

// ============================================
// UI CONSTANTS
// ============================================

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: "Owner",
  admin: "Admin",
  user: "Usuário",
  seller: "Seller",
};

export const ROLE_COLORS: Record<AppRole, string> = {
  owner: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  admin: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  user: "bg-green-500/10 text-green-500 border-green-500/20",
  seller: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export const USER_STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  suspended: "Suspenso",
  banned: "Banido",
};

export const USER_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  suspended: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  banned: "bg-red-500/10 text-red-500 border-red-500/20",
};

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  blocked: "Bloqueado",
  deleted: "Removido",
};

export const PRODUCT_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  blocked: "bg-red-500/10 text-red-500 border-red-500/20",
  deleted: "bg-muted text-muted-foreground border-muted",
};

export const SOURCE_LABELS: Record<string, string> = {
  producer: "Produtor",
  affiliate: "Afiliado",
  buyer: "Comprador",
};

export const SOURCE_COLORS: Record<string, string> = {
  producer: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  affiliate: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  buyer: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7days", label: "Últimos 7 dias" },
  { value: "30days", label: "Últimos 30 dias" },
  { value: "all", label: "Todo período" },
];

// ============================================
// ORDER STATUS CONSTANTS
// ============================================

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  expired: "Expirado",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  paid: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  refunded: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  expired: "bg-muted text-muted-foreground border-muted",
};
