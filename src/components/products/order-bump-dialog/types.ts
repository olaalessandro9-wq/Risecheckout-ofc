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

export interface OrderBumpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  onSuccess: () => void;
  editOrderBump?: any;
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
