/**
 * Tipos do OffersManager
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

export interface Offer {
  id: string;
  name: string;
  price: number; // Centavos
  is_default: boolean;
  member_group_id?: string | null;
}

export interface MemberGroupOption {
  id: string;
  name: string;
  is_default: boolean;
}

export interface OfferError {
  name?: string;
  price?: string;
}

export interface AutoSaveState {
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveError: string | null;
  showSavedIndicator: boolean;
}

export interface OffersManagerProps {
  productId: string | null;
  productName: string;
  defaultPrice: string;
  offers: Offer[];
  onOffersChange: (offers: Offer[]) => void;
  onModifiedChange: (modified: boolean) => void;
  onOfferDeleted?: (offerId: string) => void;
  onOfferCreated?: () => void;
  memberGroups?: MemberGroupOption[];
  hasMembersArea?: boolean;
  canAccessMembersArea?: boolean;
}
