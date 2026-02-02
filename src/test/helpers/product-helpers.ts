/**
 * Product Test Helpers
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Centralized helpers and factories for product-related tests.
 * Provides mock data generators and utility functions.
 * 
 * @module test/helpers/product-helpers
 */

import type { AddProductFormData } from "@/components/products/add-product-dialog/types";
import type { DeliveryType } from "@/modules/products/types/product.types";

// ============================================================================
// Mock Data Factories
// ============================================================================

/**
 * Creates mock form data for AddProductDialog
 * @param overrides - Partial data to override defaults
 * @returns Complete AddProductFormData object
 */
export function createMockProductFormData(
  overrides?: Partial<AddProductFormData>
): AddProductFormData {
  return {
    name: "Produto de Teste",
    description: "Descrição detalhada do produto de teste",
    price: 9900, // R$ 99.00 in cents
    delivery_url: "https://exemplo.com/produto",
    ...overrides,
  };
}

/**
 * Creates mock product data for API responses
 * @param overrides - Partial data to override defaults
 * @returns Complete product object
 */
export function createMockProduct(overrides?: Record<string, unknown>) {
  const id = `product-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    name: "Produto de Teste",
    description: "Descrição do produto",
    price: 9900,
    delivery_url: "https://exemplo.com/produto",
    delivery_type: "standard" as DeliveryType,
    external_delivery: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: `user-${Date.now()}`,
    ...overrides,
  };
}

/**
 * Creates mock order bump data
 * @param overrides - Partial data to override defaults
 * @returns Complete order bump object
 */
export function createMockOrderBump(overrides?: Record<string, unknown>) {
  const id = `bump-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    product_id: `product-${Date.now()}`,
    name: "Order Bump de Teste",
    description: "Descrição do order bump",
    price: 4900, // R$ 49.00
    active: true,
    position: 0,
    ...overrides,
  };
}

/**
 * Creates mock coupon data
 * @param overrides - Partial data to override defaults
 * @returns Complete coupon object
 */
export function createMockCoupon(overrides?: Record<string, unknown>) {
  const id = `coupon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    product_id: `product-${Date.now()}`,
    code: "TESTE10",
    discount_type: "percentage" as const,
    discount_value: 10,
    active: true,
    max_uses: null,
    current_uses: 0,
    expires_at: null,
    ...overrides,
  };
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates if a URL is in correct format
 * @param url - URL string to validate
 * @returns true if valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates if price is in valid range (cents)
 * @param price - Price in cents
 * @returns true if valid, false otherwise
 */
export function isValidPrice(price: number): boolean {
  return Number.isInteger(price) && price > 0 && price <= 999999900; // Max R$ 9,999,999.00
}

// ============================================================================
// Formatting Helpers
// ============================================================================

/**
 * Formats price from cents to BRL currency string
 * @param cents - Price in cents
 * @returns Formatted currency string
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/**
 * Converts BRL currency string to cents
 * @param formatted - Formatted currency string (e.g., "R$ 99,00")
 * @returns Price in cents
 */
export function parsePriceToCents(formatted: string): number {
  const cleaned = formatted.replace(/[^\d,]/g, "").replace(",", ".");
  return Math.round(parseFloat(cleaned) * 100);
}

// ============================================================================
// Test Data Generators
// ============================================================================

/**
 * Generates random product name
 * @returns Random product name
 */
export function generateProductName(): string {
  const adjectives = ["Incrível", "Completo", "Exclusivo", "Premium", "Avançado"];
  const nouns = ["Curso", "Ebook", "Treinamento", "Mentoria", "Workshop"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun} ${Date.now()}`;
}

/**
 * Generates random product description
 * @returns Random product description
 */
export function generateProductDescription(): string {
  return `Descrição detalhada do produto criado em ${new Date().toLocaleDateString("pt-BR")}. Este é um produto de teste com conteúdo de alta qualidade.`;
}

/**
 * Generates random price in cents (between R$ 10 and R$ 1000)
 * @returns Random price in cents
 */
export function generateRandomPrice(): number {
  return Math.floor(Math.random() * 99000) + 1000; // 1000 to 100000 cents
}
