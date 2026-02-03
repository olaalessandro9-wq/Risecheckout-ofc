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
  description: "Descrição completa do produto",
  price: 29700,
  image_url: "https://example.com/curso-marketing.jpg",
  status: "active",
  user_id: "producer-001",
  producer_id: "producer-001",
  category: "Marketing Digital",
  marketplace_category: "Marketing Digital",
  marketplace_enabled: true,
  marketplace_description: "Aprenda marketing digital do zero ao avançado com estratégias comprovadas.",
  marketplace_tags: ["marketing", "digital"],
  marketplace_views: 500,
  marketplace_clicks: 100,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  commission_percentage: 30,
  requires_manual_approval: false,
  has_order_bump_commission: true,
  affiliate_enabled: true,
  vendor_name: "João Silva",
  producer_name: "João Silva",
  vendor_email: "joao@example.com",
};

export const mockOwnerProduct: MarketplaceProduct = {
  ...mockMarketplaceProduct,
  id: "mp-prod-owner",
  name: "Meu Produto (Owner)",
  user_id: "current-user-id",
  producer_id: "current-user-id",
  producer_name: "Eu Mesmo",
  vendor_name: "Eu Mesmo",
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
