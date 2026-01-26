import { OrderBumpCandidate } from "@/lib/orderBump/fetchCandidates";
import { NormalizedOffer } from "@/services/offers";

export interface OrderBumpProduct extends OrderBumpCandidate {
  price: number;
  image_url?: string;
}

export interface OrderBumpFormData {
  selectedProductId: string;
  selectedOfferId: string;
  discountEnabled: boolean;
  discountPrice: string;
  callToAction: string;
  customTitle: string;
  customDescription: string;
  showImage: boolean;
}

/**
 * Interface para order bump existente durante edição.
 * Representa os dados retornados do banco de dados.
 * 
 * CRITICAL PRICE SEMANTICS:
 * - `original_price`: MARKETING price for strikethrough display only
 * - The REAL price charged comes from the linked offer/product
 * - `original_price` is NEVER used for billing calculations
 */
export interface EditOrderBump {
  id: string;
  checkout_id: string;
  product_id: string;
  offer_id?: string | null;
  position: number;
  active: boolean;
  discount_enabled?: boolean | null;
  /** MARKETING price - for strikethrough display only, never used for billing */
  original_price?: number | null;
  /** @deprecated Use original_price instead */
  discount_price?: number | null;
  call_to_action?: string | null;
  custom_title?: string | null;
  custom_description?: string | null;
  show_image?: boolean | null;
  created_at?: string;
  updated_at?: string;
  products?: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    image_url?: string | null;
  };
}

export interface OrderBumpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  onSuccess: () => void;
  editOrderBump?: EditOrderBump;
}

export interface OrderBumpFormState extends OrderBumpFormData {
  products: OrderBumpProduct[];
  offers: NormalizedOffer[];
  loading: boolean;
  loadingProducts: boolean;
  productInitialized: string | null;
}

export const DEFAULT_FORM_VALUES: OrderBumpFormData = {
  selectedProductId: "",
  selectedOfferId: "",
  discountEnabled: false,
  discountPrice: "0,00",
  callToAction: "SIM, EU ACEITO ESSA OFERTA ESPECIAL!",
  customTitle: "",
  customDescription: "",
  showImage: true,
};
