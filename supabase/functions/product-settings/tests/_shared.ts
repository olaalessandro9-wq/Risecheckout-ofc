/**
 * Shared Types & Mock Data for product-settings Tests
 * 
 * @module product-settings/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// TYPES
// ============================================================================

export type Action = 
  | "update-settings"
  | "update-general"
  | "smart-delete"
  | "update-price"
  | "update-affiliate-gateway-settings"
  | "update-members-area-settings"
  | "update-upsell-settings";

export interface ProductSettings {
  required_fields?: string[];
  default_payment_method?: string;
  pix_gateway?: string;
  credit_card_gateway?: string;
}

export interface AffiliateGatewaySettings {
  pix_gateway: string | null;
  credit_card_gateway: string | null;
}

export interface MembersAreaSettings {
  login_url?: string;
  welcome_message?: string;
}

export interface UpsellSettings {
  enabled: boolean;
  product_id?: string;
  offer_id?: string;
  checkout_id?: string;
  timer_enabled?: boolean;
  timer_minutes?: number;
  custom_page_url?: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  price: number;
  status: string;
}

export interface Order {
  id: string;
  product_id: string;
  status: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_PRODUCTS: Product[] = [
  { id: "prod-1", user_id: "user-123", name: "Produto A", price: 9700, status: "active" },
  { id: "prod-2", user_id: "user-123", name: "Produto B", price: 19700, status: "active" },
];

export const MOCK_ORDERS: Order[] = [
  { id: "order-1", product_id: "prod-1", status: "approved" },
  { id: "order-2", product_id: "prod-1", status: "pending" },
];

export const MOCK_SETTINGS: ProductSettings = {
  required_fields: ["name", "email", "phone"],
  default_payment_method: "pix",
  pix_gateway: "pushinpay",
  credit_card_gateway: "stripe",
};

export const VALID_ACTIONS: Action[] = [
  "update-settings",
  "update-general",
  "smart-delete",
  "update-price",
  "update-affiliate-gateway-settings",
  "update-members-area-settings",
  "update-upsell-settings",
];

export const VALID_GATEWAYS = ["pushinpay", "mercadopago", "asaas", "stripe"];
export const VALID_REQUIRED_FIELDS = ["name", "email", "phone", "document", "address"];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isValidAction(action: string): action is Action {
  return VALID_ACTIONS.includes(action as Action);
}

export function verifyOwnership(productId: string, userId: string): boolean {
  const product = MOCK_PRODUCTS.find(p => p.id === productId);
  if (!product) return false;
  return product.user_id === userId;
}

export function isValidPrice(price: unknown): boolean {
  if (typeof price !== "number") return false;
  if (!Number.isInteger(price)) return false;
  return price > 0;
}

export function hasOrders(productId: string): boolean {
  return MOCK_ORDERS.some(o => o.product_id === productId);
}

export function determineDeleteType(productId: string): "soft" | "hard" {
  return hasOrders(productId) ? "soft" : "hard";
}

export function isValidGateway(gateway: string | null): boolean {
  if (gateway === null) return true;
  return VALID_GATEWAYS.includes(gateway);
}

export function isValidRequiredField(field: string): boolean {
  return VALID_REQUIRED_FIELDS.includes(field);
}
