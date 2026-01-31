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
  price: 29700,
  commission_percentage: 30,
  marketplace_category: "Marketing Digital",
  producer_id: "producer-001",
  producer_name: "João Silva",
  image_url: "https://example.com/curso-marketing.jpg",
  requires_manual_approval: false,
  has_order_bump_commission: true,
  has_upsell: false,
  created_at: "2026-01-01T00:00:00Z",
  approval_mode: "automatic",
  conversion_rate: 25.5,
  cookie_duration_days: 30,
  description: "Descrição completa do produto",
  marketplace_enabled_at: null,
  marketplace_clicks: 100,
  marketplace_views: 500,
  marketplace_rules: null,
  marketplace_tags: null,
  popularity_score: 85,
  total_affiliates: 15,
};

export const mockOwnerProduct: MarketplaceProduct = {
  ...mockMarketplaceProduct,
  id: "mp-prod-owner",
  name: "Meu Produto (Owner)",
  producer_id: "current-user-id",
  producer_name: "Eu Mesmo",
  commission_percentage: 40,
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
    price: 9700,
    type: "order_bump",
    commission_percentage: 30,
  },
];

// ============================================================================
// HELPERS
// ============================================================================

export function createMockMarketplaceProduct(
  overrides: Partial<MarketplaceProduct> = {}
): MarketplaceProduct {
  return {
    ...mockMarketplaceProduct,
    id: `mp-prod-${Date.now()}`,
    ...overrides,
  };
}

export function createMockOffer(overrides: Partial<MockOffer> = {}): MockOffer {
  return {
    id: `offer-${Date.now()}`,
    name: "Test Offer",
    price: 9700,
    type: "order_bump",
    commission_percentage: 30,
    ...overrides,
  };
}

export function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}
