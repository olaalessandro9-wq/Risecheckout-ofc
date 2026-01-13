/**
 * Members Area Settings Hook
 * Handles fetching and updating product members area settings
 * OTIMIZADO: Usa React Query para cache inteligente
 * 
 * MIGRATED: Uses useAuth() instead of supabase.auth.getUser()
 */

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createLogger } from "@/lib/logger";

const log = createLogger("MembersAreaSettings");
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SUPABASE_URL } from "@/config/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";
import type { MembersAreaSettings, MemberModuleWithContents, MemberContent } from "./types";
import { normalizeContentType } from "@/modules/members-area/utils";

// Cache de 5 minutos
const SETTINGS_STALE_TIME = 5 * 60 * 1000;
const SETTINGS_CACHE_TIME = 10 * 60 * 1000;

// Query keys centralizadas
export const membersAreaQueryKeys = {
  all: ["members-area"] as const,
  settings: (productId: string) => [...membersAreaQueryKeys.all, "settings", productId] as const,
  modules: (productId: string) => [...membersAreaQueryKeys.all, "modules", productId] as const,
};

// Função para buscar settings
async function fetchMembersAreaSettings(productId: string): Promise<MembersAreaSettings> {
  const { data: product, error } = await supabase
    .from("products")
    .select("members_area_enabled, members_area_settings")
    .eq("id", productId)
    .single();

  if (error) throw error;

  return {
    enabled: product.members_area_enabled || false,
    settings: product.members_area_settings || null,
  };
}

// Função para buscar módulos
async function fetchMembersAreaModules(productId: string): Promise<MemberModuleWithContents[]> {
  const { data: modulesData, error } = await supabase
    .from("product_member_modules")
    .select(`
      *,
      contents:product_member_content (*)
    `)
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (error) throw error;

  return (modulesData || []).map((module) => ({
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
  setIsSaving: (saving: boolean) => void;
  settings: MembersAreaSettings;
  modules: MemberModuleWithContents[];
  setModules: React.Dispatch<React.SetStateAction<MemberModuleWithContents[]>>;
  updateSettings: (enabled: boolean, settings?: Json) => Promise<void>;
  fetchData: () => Promise<void>;
}

export function useMembersAreaSettings(productId: string | undefined): UseMembersAreaSettingsReturn {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [localModules, setLocalModules] = useState<MemberModuleWithContents[]>([]);

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

  // Reset localModules quando productId muda
  useEffect(() => {
    setLocalModules([]);
  }, [productId]);

  // Sincronizar localModules quando modulesQuery.data carrega/muda
  useEffect(() => {
    if (modulesQuery.data && modulesQuery.data.length > 0) {
      setLocalModules(modulesQuery.data);
    }
  }, [modulesQuery.data]);

  // Usar sempre localModules (agora sincronizado com React Query)
  const modules = localModules;

  // Mutation para atualizar settings via Edge Function
  const updateMutation = useMutation({
    mutationFn: async ({ enabled, newSettings }: { enabled: boolean; newSettings?: Json }) => {
      if (!productId) throw new Error("Product ID required");

      const { getProducerSessionToken } = await import("@/hooks/useProducerSession");
      const sessionToken = await getProducerSessionToken();
      
      const { data: result, error } = await supabase.functions.invoke('product-settings', {
        body: {
          action: 'update-members-area-settings',
          productId,
          enabled,
          settings: newSettings,
          sessionToken,
        }
      });
      
      if (error || !result?.success) {
        throw new Error(result?.error || error?.message || "Erro ao atualizar configurações");
      }

      // Configurações adicionais quando habilitado
      if (enabled && user?.email) {
        try {
          const { data: product } = await supabase
            .from("products")
            .select("user_id")
            .eq("id", productId)
            .single();

          if (product?.user_id) {
            await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth/ensure-producer-access`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                productId: productId,
                producerUserId: product.user_id,
              }),
            });
          }

          const { data: existingGroups } = await supabase.functions.invoke('members-area-groups', {
            body: { action: 'list', product_id: productId }
          });

          const groupsList = existingGroups?.groups || existingGroups?.data || [];
          
          if (!groupsList.length) {
            await supabase.functions.invoke('members-area-groups', {
              body: { 
                action: 'create', 
                product_id: productId,
                data: { 
                  name: 'Padrão', 
                  description: 'Grupo padrão para todos os alunos', 
                  is_default: true 
                }
              }
            });
          }
        } catch (accessError) {
          log.error("Error in setup", accessError);
        }
      }

      return { enabled, settings: newSettings || currentSettings };
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
      setIsSaving(false);
    },
  });

  const updateSettings = useCallback(async (enabled: boolean, newSettings?: Json) => {
    if (!productId) return;
    setIsSaving(true);
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
    isSaving,
    setIsSaving,
    settings: settingsQuery.data ?? { enabled: false, settings: null },
    modules,
    setModules: setLocalModules,
    updateSettings,
    fetchData,
  };
}
