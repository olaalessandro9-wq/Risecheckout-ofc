/**
 * UnifiedGroupModal Types
 * Shared types for the modularized group modal components
 */

import type { MemberGroup, GroupPermission } from '@/modules/members-area/types';
import type { MemberModule } from '@/modules/members-area/types/module.types';
import type { ProductOffer } from '@/modules/members-area/services/groups.service';

/** Props for the main UnifiedGroupModal component */
export interface UnifiedGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  group?: MemberGroup | null;
  modules: MemberModule[];
  offers: ProductOffer[];
  permissions?: GroupPermission[];
  onSave: (data: GroupFormData) => Promise<boolean>;
  isLoadingPermissions?: boolean;
}

/** Data structure for saving a group */
export interface GroupFormData {
  name: string;
  description?: string;
  is_default: boolean;
  permissions: { module_id: string; has_access: boolean }[];
  linkedOfferIds: string[];
}

/** Props for GroupFormFields component */
export interface GroupFormFieldsProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  isDefault: boolean;
  setIsDefault: (isDefault: boolean) => void;
  nameError?: string;
  clearNameError: () => void;
}

/** Props for ModulesAccessSection component */
export interface ModulesAccessSectionProps {
  modules: MemberModule[];
  moduleAccess: Record<string, boolean>;
  isLoading: boolean;
  accessCount: number;
  allSelected: boolean;
  error?: string;
  onToggleModule: (moduleId: string) => void;
  onSelectAll: () => void;
}

/** Props for OffersLinkSection component */
export interface OffersLinkSectionProps {
  offers: ProductOffer[];
  linkedOffers: Record<string, boolean>;
  linkedCount: number;
  onToggleOffer: (offerId: string) => void;
}
