/**
 * Members Area Settings Hook
 * Handles fetching and updating product members area settings
 * 
 * OPTIMIZED V3: Backend now handles all enable logic in single call
 * Frontend reduced from 5 sequential calls to 1 call
 * 
 * @see RISE Protocol V3 - State Management via XState
 */

import { useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMachine } from "@xstate/react";
import { createLogger } from "@/lib/logger";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import type { Json } from "@/integrations/supabase/types";
import type { MembersAreaSettings, ModuleWithContents, MemberContent } from "./types";
import { normalizeContentType } from "../utils";
import { membersAreaMachine, initialMembersAreaContext, type MembersAreaMachineEvent } from "./machines";

const log = createLogger("MembersAreaSettings");

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
  data?: ModuleWithContents[];
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
async function fetchMembersAreaModules(productId: string): Promise<ModuleWithContents[]> {
  const { data, error } = await api.call<ModulesResponse>('admin-data', { 
    action: 'members-area-modules-with-contents',
    productId,
  });

  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Erro ao carregar modules');

  return (data.data || []).map((module: ModuleWithContents) => ({
    ...module,
    contents: (module.contents || [])
      .sort((a, b) => a.position - b.position)
      .map((content) => ({
        ...content,
        content_type: normalizeContentType(content.content_type),
      })) as MemberContent[],
  })) as ModuleWithContents[];
}

interface UseMembersAreaSettingsReturn {
  isLoading: boolean;
  isSaving: boolean;
  settings: MembersAreaSettings;
  modules: ModuleWithContents[];
  dispatch: (event: MembersAreaMachineEvent) => void;
  updateSettings: (enabled: boolean, settings?: Json) => Promise<void>;
  fetchData: () => Promise<void>;
}

export function useMembersAreaSettings(productId: string | undefined): UseMembersAreaSettingsReturn {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();
  
  // Single Source of Truth via XState
  const [state, send] = useMachine(membersAreaMachine);

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
    send({ type: 'RESET', modules: [] });
  }, [productId, send]);

  // RISE V3: Sincronizar modules do React Query com State Machine
  // Usar LOAD em vez de SET_MODULES para garantir transição idle → ready
  // mesmo quando a lista está vazia (permite ADD_MODULE funcionar desde o primeiro módulo)
  useEffect(() => {
    if (modulesQuery.data !== undefined) {
      send({ type: 'LOAD', modules: modulesQuery.data });
    }
  }, [modulesQuery.data, send]);

  // Mutation para atualizar settings via Edge Function
  const updateMutation = useMutation({
    mutationFn: async ({ enabled, newSettings }: { enabled: boolean; newSettings?: Json }) => {
      if (!productId) throw new Error("Product ID required");

      const { data: result, error } = await api.call<{ success: boolean; error?: string }>('product-settings', {
        action: 'update-members-area-settings',
        productId,
        enabled,
        membersSettings: newSettings,
        producerEmail: user?.email,
      });
      
      if (error || !result?.success) {
        throw new Error(result?.error || error?.message || "Erro ao atualizar configurações");
      }

      return { enabled, settings: newSettings || settingsQuery.data?.settings };
    },
    onSuccess: (data) => {
      if (productId) {
        queryClient.setQueryData(membersAreaQueryKeys.settings(productId), {
          enabled: data.enabled,
          settings: data.settings,
        });
      }
      // RISE V3: Toast responsibility delegated to calling component (SSOT)
    },
    onError: (error) => {
      log.error("Error updating settings", error);
      // RISE V3: Toast responsibility delegated to calling component (SSOT)
    },
    onSettled: () => {
      send({ type: 'SET_SAVING', isSaving: false });
    },
  });

  const updateSettings = useCallback(async (enabled: boolean, newSettings?: Json) => {
    if (!productId) return;
    send({ type: 'SET_SAVING', isSaving: true });
    await updateMutation.mutateAsync({ enabled, newSettings });
  }, [productId, updateMutation, send]);

  const fetchData = useCallback(async () => {
    if (!productId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: membersAreaQueryKeys.settings(productId) }),
      queryClient.invalidateQueries({ queryKey: membersAreaQueryKeys.modules(productId) }),
    ]);
  }, [productId, queryClient]);

  // Adapter: map send to dispatch for consistent public API
  const dispatch = useCallback((event: MembersAreaMachineEvent) => {
    send(event);
  }, [send]);

  return {
    isLoading: settingsQuery.isLoading || modulesQuery.isLoading,
    isSaving: state.context.isSaving,
    settings: settingsQuery.data ?? { enabled: false, settings: null },
    modules: state.context.modules,
    dispatch,
    updateSettings,
    fetchData,
  };
}
