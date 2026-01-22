/**
 * MembersAreaContext - Provider Unificado (SSOT)
 * 
 * RISE V3: Single Source of Truth para toda a seção Members Area.
 * Elimina múltiplas instâncias de useMembersArea e useGroups.
 * 
 * @see docs/MEMBERS_AREA_MODULE.md
 */

import { createContext, useContext, ReactNode } from "react";
import { useMembersArea } from "../hooks/useMembersArea";
import { useGroups } from "../hooks/useGroups";
import type { UseMembersAreaReturn } from "../hooks/types";
import type { MemberGroup, GroupWithPermissions, UpdateGroupInput, UpdatePermissionsInput } from "../types";
import type { ProductOffer } from "../services/groups.service";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface UseGroupsReturn {
  groups: MemberGroup[];
  offers: ProductOffer[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  fetchOffers: () => Promise<void>;
  getGroup: (groupId: string) => Promise<GroupWithPermissions | null>;
  createGroup: (input: Omit<{ product_id: string; name: string; description?: string; is_default?: boolean; position?: number }, 'product_id'>) => Promise<MemberGroup | null>;
  updateGroup: (groupId: string, input: UpdateGroupInput) => Promise<boolean>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  updatePermissions: (input: UpdatePermissionsInput, options?: { silent?: boolean }) => Promise<boolean>;
  linkOffers: (groupId: string, offerIds: string[], options?: { silent?: boolean }) => Promise<boolean>;
}

interface MembersAreaContextValue {
  /** Core members area data and actions */
  membersArea: UseMembersAreaReturn;
  /** Groups management data and actions */
  groups: UseGroupsReturn;
  /** Current product ID */
  productId: string | undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const MembersAreaContext = createContext<MembersAreaContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

interface MembersAreaProviderProps {
  productId: string | undefined;
  children: ReactNode;
}

export function MembersAreaProvider({ productId, children }: MembersAreaProviderProps) {
  // Single instance of each hook - shared by all consumers
  const membersArea = useMembersArea(productId);
  const groups = useGroups(productId);
  
  return (
    <MembersAreaContext.Provider value={{ membersArea, groups, productId }}>
      {children}
    </MembersAreaContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useMembersAreaContext(): MembersAreaContextValue {
  const context = useContext(MembersAreaContext);
  if (!context) {
    throw new Error(
      "useMembersAreaContext must be used within MembersAreaProvider. " +
      "Wrap your component tree with <MembersAreaProvider productId={...}>."
    );
  }
  return context;
}

// Re-export the type for external use
export type { MembersAreaContextValue, UseGroupsReturn };
