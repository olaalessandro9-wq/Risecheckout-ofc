/**
 * Checkout Customizer Module Types
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import type { ProductData, OrderBump } from "@/types/checkout";

/** Product offer from database */
export interface ProductOffer {
  id: string;
  name: string;
  price: number;
  status: string;
}

/** Payment link data */
export interface PaymentLinkData {
  id: string;
  offer_id?: string;
}

/** Order bump from API response */
export interface OrderBumpApiResponse {
  id: string;
  custom_title?: string;
  custom_description?: string;
  show_image?: boolean;
  products?: {
    name?: string;
    price?: number;
    image_url?: string;
  };
  offers?: {
    price?: number;
  };
}

export interface CheckoutPersistenceState {
  loading: boolean;
  isSaving: boolean;
  productData: ProductData | null;
  orderBumps: OrderBump[];
  productOffers: ProductOffer[];
  currentLinks: PaymentLinkData[];
}
