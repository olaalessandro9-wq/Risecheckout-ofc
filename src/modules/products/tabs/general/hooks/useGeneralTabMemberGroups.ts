/**
 * useGeneralTabMemberGroups - Lógica de Grupos de Membros
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { MemberGroupOption } from "@/components/products/OffersManager";

interface UseGeneralTabMemberGroupsProps {
  productId: string | undefined;
  membersAreaEnabled: boolean | undefined;
}

export function useGeneralTabMemberGroups({ productId, membersAreaEnabled }: UseGeneralTabMemberGroupsProps) {
  const [memberGroups, setMemberGroups] = useState<MemberGroupOption[]>([]);
  const [hasMembersArea, setHasMembersArea] = useState(false);

  useEffect(() => {
    if (!productId) return;
    
    setHasMembersArea(membersAreaEnabled || false);
    
    if (membersAreaEnabled) {
      const fetchGroups = async () => {
        try {
          interface MemberGroupFromAPI {
            id: string;
            name: string;
            is_default?: boolean;
          }
          
          const { data, error } = await api.call<{ groups?: MemberGroupFromAPI[] }>('members-area-groups', {
            action: 'list',
            product_id: productId,
          });
          
          if (!error && data?.groups) {
            setMemberGroups(data.groups.map((g: MemberGroupFromAPI) => ({
              id: g.id,
              name: g.name,
              is_default: g.is_default,
            })));
          }
        } catch (err) {
          console.error('[useGeneralTabMemberGroups] Error fetching groups:', err);
        }
      };
      
      fetchGroups();
    } else {
      setMemberGroups([]);
    }
  }, [productId, membersAreaEnabled]);

  return {
    memberGroups,
    hasMembersArea,
  };
}
