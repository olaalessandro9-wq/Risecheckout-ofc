/**
 * @file _fixtures.ts
 * @description Test fixtures for ProductDetails components
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import type { Database } from "@/integrations/supabase/types";

type MarketplaceProduct = Database["public"]["Views"]["marketplace_products"]["Row"];

// ============================================================================
// MARKETPLACE PRODUCTS
// ============================================================================

export const mockMarketplaceProduct: MarketplaceProduct = {
  id: "mp-prod-001",
  name: "Curso Completo de Marketing Digital",
  marketplace_description: "Aprenda marketing digital do zero ao avançado com estratégias comprovadas.",
  price: 29700, // R$ 297,00
  commission_percentage: 30,
  marketplace_category: "Marketing Digital",
  producer_id: "producer-001",
  producer_name: "João Silva",
  image_url: "https://example.com/curso-marketing.jpg",
  requires_manual_approval: false,
  has_order_bump_commission: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-15T00:00:00Z",
  views_count: 1250,
  clicks_count: 340,
  sales_count: 87,
  approval_mode: "automatic",
  conversion_rate: 25.5,
  cookie_duration_days: 30,
  description: "Descrição completa do produto",
  marketplace_enabled: true,
  product_type: "course",
  support_email: "suporte@example.com",
  support_name: "Suporte Rise",
  total_affiliates: 15,
  total_earnings: 500000,
  user_id: "user-001",
};

export const mockOwnerProduct: MarketplaceProduct = {
  ...mockMarketplaceProduct,
  id: "mp-prod-owner",
  name: "Meu Produto (Owner)",
  producer_id: "current-user-id",
  producer_name: "Eu Mesmo",
  commission_percentage: 40,
};

export const mockProductWithManualApproval: MarketplaceProduct = {
  ...mockMarketplaceProduct,
  id: "mp-prod-manual",
  name: "Produto com Aprovação Manual",
  requires_manual_approval: true,
  commission_percentage: 50,
};

export const mockProductNoOrderBump: MarketplaceProduct = {
  ...mockMarketplaceProduct,
  id: "mp-prod-no-bump",
  name: "Produto sem Order Bump",
  has_order_bump_commission: false,
};

export const mockProductHighCommission: MarketplaceProduct = {
  ...mockMarketplaceProduct,
  id: "mp-prod-high-comm",
  name: "Produto Comissão Alta",
  commission_percentage: 70,
  price: 49700, // R$ 497,00
};

// ============================================================================
// OFFERS
// ============================================================================

export interface MockOffer {
  id: string;
  name: string;
  price: number;
  type: "order_bump" | "upsell" | "downsell";
  commission_percentage: number;
}

export const mockOffers: MockOffer[] = [
  {
    id: "offer-001",
    name: "Order Bump: Bônus Exclusivo",
    price: 9700, // R$ 97,00
    type: "order_bump",
    commission_percentage: 30,
  },
  {
    id: "offer-002",
    name: "Upsell: Mentoria Premium",
    price: 197000, // R$ 1.970,00
    type: "upsell",
    commission_percentage: 30,
  },
  {
    id: "offer-003",
    name: "Downsell: Acesso Básico",
    price: 4700, // R$ 47,00
    type: "downsell",
    commission_percentage: 30,
  },
];

export const mockOffersHighCommission: MockOffer[] = [
  {
    id: "offer-high-001",
    name: "Order Bump Premium",
    price: 14700,
    type: "order_bump",
    commission_percentage: 50,
  },
];

// ============================================================================
// AFFILIATION STATUS
// ============================================================================

export interface MockAffiliationStatus {
  isAffiliate: boolean;
  status: "active" | "pending" | "rejected" | null;
  affiliationId: string | null;
}

export const mockAffiliationActive: MockAffiliationStatus = {
  isAffiliate: true,
  status: "active",
  affiliationId: "aff-001",
};

export const mockAffiliationPending: MockAffiliationStatus = {
  isAffiliate: false,
  status: "pending",
  affiliationId: "aff-002",
};

export const mockAffiliationRejected: MockAffiliationStatus = {
  isAffiliate: false,
  status: "rejected",
  affiliationId: null,
};

export const mockAffiliationNone: MockAffiliationStatus = {
  isAffiliate: false,
  status: null,
  affiliationId: null,
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Creates a mock MarketplaceProduct with custom overrides
 */
export function createMockMarketplaceProduct(
  overrides: Partial<MarketplaceProduct> = {}
): MarketplaceProduct {
  return {
    ...mockMarketplaceProduct,
    id: `mp-prod-${Date.now()}`,
    ...overrides,
  };
}

/**
 * Creates a mock Offer with custom overrides
 */
export function createMockOffer(
  overrides: Partial<MockOffer> = {}
): MockOffer {
  return {
    id: `offer-${Date.now()}`,
    name: "Test Offer",
    price: 9700,
    type: "order_bump",
    commission_percentage: 30,
    ...overrides,
  };
}

/**
 * Calculates commission value for a product
 */
export function calculateCommission(
  price: number,
  commissionPercentage: number
): number {
  return Math.floor((price * commissionPercentage) / 100);
}

/**
 * Formats price in cents to BRL string
 */
export function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}
