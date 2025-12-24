/**
 * ProductOffersSection - Seção de ofertas do produto
 */

import { OffersManager, type Offer } from "@/components/products/OffersManager";
import type { GeneralFormData } from "./types";

interface Props {
  productId: string;
  form: GeneralFormData;
  offers: Offer[];
  onOffersChange: (offers: Offer[]) => void;
  onModifiedChange: (modified: boolean) => void;
  onOfferDeleted: (offerId: string) => void;
}

export function ProductOffersSection({
  productId,
  form,
  offers,
  onOffersChange,
  onModifiedChange,
  onOfferDeleted,
}: Props) {
  return (
    <OffersManager
      productId={productId}
      productName={form.name}
      defaultPrice={String(form.price)}
      offers={offers}
      onOffersChange={onOffersChange}
      onModifiedChange={onModifiedChange}
      onOfferDeleted={onOfferDeleted}
    />
  );
}
