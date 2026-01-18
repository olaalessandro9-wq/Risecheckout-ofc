/**
 * Members Area Settings Hook
 * Handles fetching and updating product members area settings
 * 
 * OPTIMIZED V3: Backend now handles all enable logic in single call
 * Frontend reduced from 5 sequential calls to 1 call
 * 
 * @see RISE Protocol V3 - State Management via Reducer
 */

import { useReducer, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createLogger } from "@/lib/logger";

const log = createLogger("MembersAreaSettings");
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";
import type { MembersAreaSettings, MemberModuleWithContents, MemberContent } from "./types";
import { normalizeContentType } from "@/modules/members-area/utils";
import { 
  membersAreaReducer, 
  INITIAL_MEMBERS_AREA_STATE,
  type MembersAreaAction 
} from "./membersAreaReducer";

interface SettingsResponse {
  success: boolean;
  error?: string;
  data?: {
    enabled: boolean;
    settings: Json | null;
  };
}

interface ModulesResponse {
  success: boolean;
  error?: string;
  data?: MemberModuleWithContents[];
}

// Cache de 5 minutos
const SETTINGS_STALE_TIME = 5 * 60 * 1000;
const SETTINGS_CACHE_TIME = 10 * 60 * 1000;

// Query keys centralizadas
export const membersAreaQueryKeys = {
  all: ["members-area"] as const,
  settings: (productId: string) => [...membersAreaQueryKeys.all, "settings", productId] as const,
  modules: (productId: string) => [...membersAreaQueryKeys.all, "modules", productId] as const,
};

/**
 * Fetch settings via Edge Function
 */
async function fetchMembersAreaSettings(productId: string): Promise<MembersAreaSettings> {
  const { data, error } = await api.call<SettingsResponse>('admin-data', { 
    action: 'members-area-settings',
    productId,
  });

  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Erro ao carregar settings');

  return {
    enabled: data.data?.enabled || false,
    settings: data.data?.settings || null,
  };
}

/**
 * Fetch modules via Edge Function
 */
async function fetchMembersAreaModules(productId: string): Promise<MemberModuleWithContents[]> {
  const { data, error } = await api.call<ModulesResponse>('admin-data', { 
    action: 'members-area-modules-with-contents',
    productId,
  });

  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Erro ao carregar modules');

  return (data.data || []).map((module: MemberModuleWithContents) => ({
    ...module,
    contents: (module.contents || [])
      .sort((a, b) => a.position - b.position)
      .map((content) => ({
        ...content,
        content_type: normalizeContentType(content.content_type),
      })) as MemberContent[],
  })) as MemberModuleWithContents[];
}

interface UseMembersAreaSettingsReturn {
  isLoading: boolean;
  isSaving: boolean;
  settings: MembersAreaSettings;
  modules: MemberModuleWithContents[];
  dispatch: React.Dispatch<MembersAreaAction>;
  updateSettings: (enabled: boolean, settings?: Json) => Promise<void>;
  fetchData: () => Promise<void>;
}

export function useMembersAreaSettings(productId: string | undefined): UseMembersAreaSettingsReturn {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Single Source of Truth via Reducer
  const [state, dispatch] = useReducer(membersAreaReducer, INITIAL_MEMBERS_AREA_STATE);

  // Query para settings
  const settingsQuery = useQuery({
    queryKey: productId ? membersAreaQueryKeys.settings(productId) : ["disabled"],
    queryFn: () => fetchMembersAreaSettings(productId!),
    enabled: !!productId,
    staleTime: SETTINGS_STALE_TIME,
    gcTime: SETTINGS_CACHE_TIME,
  });

  // Query para módulos
  const modulesQuery = useQuery({
    queryKey: productId ? membersAreaQueryKeys.modules(productId) : ["disabled"],
    queryFn: () => fetchMembersAreaModules(productId!),
    enabled: !!productId,
    staleTime: SETTINGS_STALE_TIME,
    gcTime: SETTINGS_CACHE_TIME,
  });

  // Reset modules quando productId muda
  useEffect(() => {
    dispatch({ type: 'RESET', modules: [] });
  }, [productId]);

  // Sincronizar modules do React Query com Reducer
  useEffect(() => {
    if (modulesQuery.data && modulesQuery.data.length > 0) {
      dispatch({ type: 'SET_MODULES', modules: modulesQuery.data });
    }
  }, [modulesQuery.data]);

  // Mutation para atualizar settings via Edge Function
  // OPTIMIZED V3: Backend agora faz tudo em uma única chamada quando enabled=true
  const updateMutation = useMutation({
    mutationFn: async ({ enabled, newSettings }: { enabled: boolean; newSettings?: Json }) => {
      if (!productId) throw new Error("Product ID required");

      // Single API call - backend handles all setup logic
      const { data: result, error } = await api.call<{ success: boolean; error?: string }>('product-settings', {
        action: 'update-members-area-settings',
        productId,
        enabled,
        settings: newSettings,
        producerEmail: user?.email, // Backend uses this for setup when enabling
      });
      
      if (error || !result?.success) {
        throw new Error(result?.error || error?.message || "Erro ao atualizar configurações");
      }

      return { enabled, settings: newSettings || settingsQuery.data?.settings };
    },
    onSuccess: (data) => {
      // Atualizar cache
      if (productId) {
        queryClient.setQueryData(membersAreaQueryKeys.settings(productId), {
          enabled: data.enabled,
          settings: data.settings,
        });
      }
      toast.success("Configurações atualizadas!");
    },
    onError: (error) => {
      log.error("Error updating settings", error);
      toast.error("Erro ao atualizar configurações");
    },
    onSettled: () => {
      dispatch({ type: 'SET_SAVING', isSaving: false });
    },
  });

  const updateSettings = useCallback(async (enabled: boolean, newSettings?: Json) => {
    if (!productId) return;
    dispatch({ type: 'SET_SAVING', isSaving: true });
    await updateMutation.mutateAsync({ enabled, newSettings });
  }, [productId, updateMutation]);

  const fetchData = useCallback(async () => {
    if (!productId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: membersAreaQueryKeys.settings(productId) }),
      queryClient.invalidateQueries({ queryKey: membersAreaQueryKeys.modules(productId) }),
    ]);
  }, [productId, queryClient]);

  return {
    isLoading: settingsQuery.isLoading || modulesQuery.isLoading,
    isSaving: state.isSaving,
    settings: settingsQuery.data ?? { enabled: false, settings: null },
    modules: state.modules,
    dispatch,
    updateSettings,
    fetchData,
  };
}
