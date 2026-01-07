/**
 * Members Area Settings Hook
 * Handles fetching and updating product members area settings
 */

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SUPABASE_URL } from "@/config/supabase";
import type { Json } from "@/integrations/supabase/types";
import type { MembersAreaSettings, MemberModuleWithContents, MemberContent } from "./types";
import { normalizeContentType } from "@/modules/members-area/utils";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<MembersAreaSettings>({ enabled: false, settings: null });
  const [modules, setModules] = useState<MemberModuleWithContents[]>([]);

  const fetchData = useCallback(async () => {
    if (!productId) return;

    setIsLoading(true);
    try {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("members_area_enabled, members_area_settings")
        .eq("id", productId)
        .single();

      if (productError) throw productError;

      setSettings({
        enabled: product.members_area_enabled || false,
        settings: product.members_area_settings || null,
      });

      const { data: modulesData, error: modulesError } = await supabase
        .from("product_member_modules")
        .select(`
          *,
          contents:product_member_content (*)
        `)
        .eq("product_id", productId)
        .order("position", { ascending: true });

      if (modulesError) throw modulesError;

      const sortedModules = (modulesData || []).map((module) => ({
        ...module,
        contents: (module.contents || [])
          .sort((a, b) => a.position - b.position)
          .map((content) => ({
            ...content,
            content_type: normalizeContentType(content.content_type),
          })) as MemberContent[],
      })) as MemberModuleWithContents[];

      setModules(sortedModules);
    } catch (error) {
      console.error("[useMembersAreaSettings] Error fetching data:", error);
      toast.error("Erro ao carregar dados da área de membros");
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateSettings = useCallback(async (enabled: boolean, newSettings?: Json) => {
    if (!productId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          members_area_enabled: enabled,
          members_area_settings: newSettings || settings.settings,
        })
        .eq("id", productId);

      if (error) throw error;

      if (enabled) {
        try {
          const { data: product } = await supabase
            .from("products")
            .select("user_id")
            .eq("id", productId)
            .single();

          if (product?.user_id) {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            
            if (currentUser?.email) {
              await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth/ensure-producer-access`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: currentUser.email,
                  productId: productId,
                  producerUserId: product.user_id,
                }),
              });
            }
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
          console.error("[useMembersAreaSettings] Error in setup:", accessError);
        }
      }

      setSettings({ enabled, settings: newSettings || settings.settings });
      toast.success("Configurações atualizadas!");
    } catch (error) {
      console.error("[useMembersAreaSettings] Error updating settings:", error);
      toast.error("Erro ao atualizar configurações");
    } finally {
      setIsSaving(false);
    }
  }, [productId, settings.settings]);

  return {
    isLoading,
    isSaving,
    setIsSaving,
    settings,
    modules,
    setModules,
    updateSettings,
    fetchData,
  };
}
