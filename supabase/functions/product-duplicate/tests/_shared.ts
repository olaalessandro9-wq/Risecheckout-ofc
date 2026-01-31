/**
 * Product Duplicate Tests - Shared Types and Utilities
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module product-duplicate/tests/_shared
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ProductBase {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  user_id: string;
  status: string | null;
  support_name: string | null;
  support_email: string | null;
}

export interface CheckoutRow {
  id: string;
  checkout_id: string;
  layout: string;
  row_order: number;
}

export interface CheckoutComponent {
  id: string;
  row_id: string;
  type: string;
  content: Record<string, unknown>;
  component_order: number;
}

export interface Offer {
  id: string;
  product_id: string;
  name: string;
  price: number;
  is_default: boolean;
  status: string;
}

export interface Checkout {
  id: string;
  product_id: string;
  name: string;
  slug: string | null;
  seller_name: string | null;
  is_default: boolean;
  status: string | null;
  visits_count: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const mockProduct: ProductBase = {
  id: "prod-123",
  name: "Curso de Marketing Digital",
  description: "Aprenda marketing digital do zero",
  price: 19700,
  image_url: "https://example.com/image.jpg",
  user_id: "user-456",
  status: "active",
  support_name: "Suporte Rise",
  support_email: "suporte@rise.com",
};

export const mockOffers: Offer[] = [
  { id: "off-1", product_id: "prod-123", name: "Oferta Padrão", price: 19700, is_default: true, status: "active" },
  { id: "off-2", product_id: "prod-123", name: "Oferta VIP", price: 39700, is_default: false, status: "active" },
];

export const mockCheckouts: Checkout[] = [
  { id: "ck-1", product_id: "prod-123", name: "Checkout Principal", slug: "abc1234_xyz789", seller_name: "Rise", is_default: true, status: "active", visits_count: 100 },
  { id: "ck-2", product_id: "prod-123", name: "Checkout VIP", slug: "vip4567_lmn012", seller_name: "Rise VIP", is_default: false, status: "active", visits_count: 50 },
];

export const mockCheckoutRows: CheckoutRow[] = [
  { id: "row-1", checkout_id: "ck-1", layout: "single", row_order: 0 },
  { id: "row-2", checkout_id: "ck-1", layout: "double", row_order: 1 },
];

export const mockComponents: CheckoutComponent[] = [
  { id: "comp-1", row_id: "row-1", type: "header", content: { text: "Título" }, component_order: 0 },
  { id: "comp-2", row_id: "row-1", type: "text", content: { body: "Descrição" }, component_order: 1 },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates if product ID has UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Builds duplicate name with suffix
 */
export function buildDuplicateName(originalName: string): string {
  const suffix = " (Cópia)";
  const maxLength = 100;
  const maxOriginalLength = maxLength - suffix.length;
  
  if (originalName.length > maxOriginalLength) {
    return originalName.substring(0, maxOriginalLength - 3) + "..." + suffix;
  }
  return originalName + suffix;
}

/**
 * Generates unique slug in format xxxxxxx_xxxxxx
 */
export function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let part1 = "";
  let part2 = "";
  
  for (let i = 0; i < 7; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  for (let i = 0; i < 6; i++) {
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${part1}_${part2}`;
}

/**
 * Validates slug format
 */
export function isValidSlugFormat(slug: string): boolean {
  return /^[a-z0-9]{7}_[a-z0-9]{6}$/.test(slug);
}

/**
 * Verifies product ownership
 */
export function verifyOwnership(productId: string, userId: string, product: ProductBase | null): boolean {
  if (!product) return false;
  return product.id === productId && product.user_id === userId;
}
