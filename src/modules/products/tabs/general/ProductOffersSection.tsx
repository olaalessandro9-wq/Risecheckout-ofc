/**
 * ProductOffersSection - Seção de ofertas do produto
 */

import { OffersManager, type Offer, type MemberGroupOption } from "@/components/products/OffersManager";
import { useProductContext } from "../../context/ProductContext";
import type { GeneralFormData } from "../../types/formData.types";

interface Props {
  productId: string;
  form: GeneralFormData;
  offers: Offer[];
  onOffersChange: (offers: Offer[]) => void;
  onModifiedChange: (modified: boolean) => void;
  onOfferDeleted: (offerId: string) => void;
  memberGroups?: MemberGroupOption[];
  hasMembersArea?: boolean;
  canAccessMembersArea?: boolean;
}

export function ProductOffersSection({
  productId,
  form,
  offers,
  onOffersChange,
  onModifiedChange,
  onOfferDeleted,
  memberGroups = [],
  hasMembersArea = false,
  canAccessMembersArea = false,
}: Props) {
  const { refreshAll } = useProductContext();

  const handleOfferCreated = () => {
    refreshAll();
  };

  return (
    <OffersManager
      productId={productId}
      productName={form.name}
      defaultPrice={String(form.price)}
      offers={offers}
      onOffersChange={onOffersChange}
      onModifiedChange={onModifiedChange}
      onOfferDeleted={onOfferDeleted}
      onOfferCreated={handleOfferCreated}
      memberGroups={memberGroups}
      hasMembersArea={hasMembersArea}
      canAccessMembersArea={canAccessMembersArea}
    />
  );
}
