import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SUPABASE_URL } from "@/config/supabase";
import type { Json } from "@/integrations/supabase/types";

/** Content display type - unified system */
export type ContentDisplayType = "mixed" | "video" | "text";

export interface MemberModule {
  id: string;
  product_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemberContent {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  content_type: ContentDisplayType;
  content_url: string | null;
  body: string | null;
  content_data: Json | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemberModuleWithContents extends MemberModule {
  contents: MemberContent[];
}

export interface MembersAreaSettings {
  enabled: boolean;
  settings: Json | null;
}

export interface UseMembersAreaReturn {
  isLoading: boolean;
  isSaving: boolean;
  settings: MembersAreaSettings;
  modules: MemberModuleWithContents[];
  updateSettings: (enabled: boolean, settings?: Json) => Promise<void>;
  fetchModules: () => Promise<void>;
  addModule: (title: string, description?: string, coverImageUrl?: string) => Promise<MemberModule | null>;
  updateModule: (id: string, data: Partial<MemberModule>) => Promise<void>;
  deleteModule: (id: string) => Promise<void>;
  reorderModules: (orderedIds: string[]) => Promise<void>;
  addContent: (moduleId: string, data: Omit<MemberContent, "id" | "module_id" | "position" | "created_at" | "updated_at">) => Promise<MemberContent | null>;
  updateContent: (id: string, data: Partial<MemberContent>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  reorderContents: (moduleId: string, orderedIds: string[]) => Promise<void>;
}

export function useMembersArea(productId: string | undefined): UseMembersAreaReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<MembersAreaSettings>({ enabled: false, settings: null });
  const [modules, setModules] = useState<MemberModuleWithContents[]>([]);

  // Fetch settings and modules
  const fetchData = useCallback(async () => {
    if (!productId) return;

    setIsLoading(true);
    try {
      // Fetch product settings
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

      // Fetch modules with contents
      const { data: modulesData, error: modulesError } = await supabase
        .from("product_member_modules")
        .select(`
          *,
          contents:product_member_content (*)
        `)
        .eq("product_id", productId)
        .order("position", { ascending: true });

      if (modulesError) throw modulesError;

      // Sort contents by position and normalize content_type
      const sortedModules = (modulesData || []).map((module) => ({
        ...module,
        contents: (module.contents || [])
          .sort((a, b) => a.position - b.position)
          .map((content) => ({
            ...content,
            // Normalize legacy content types to unified system
            content_type: normalizeContentType(content.content_type),
          })) as MemberContent[],
      })) as MemberModuleWithContents[];

      setModules(sortedModules);
    } catch (error) {
      console.error("[useMembersArea] Error fetching data:", error);
      toast.error("Erro ao carregar dados da área de membros");
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchModules = fetchData;

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

      // Se está ativando a área de membros, criar acesso automático para o produtor e grupo padrão
      if (enabled) {
        try {
          // Buscar dados do produto para obter o user_id do produtor
          const { data: product } = await supabase
            .from("products")
            .select("user_id")
            .eq("id", productId)
            .single();

          if (product?.user_id) {
            // Buscar o usuário logado atualmente (que é o produtor)
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            
            if (currentUser?.email) {
              // Criar buyer_profile e acesso via edge function
              await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth/ensure-producer-access`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: currentUser.email,
                  productId: productId,
                  producerUserId: product.user_id,
                }),
              });
              console.log("[useMembersArea] Producer access ensured for:", currentUser.email);
            }
          }

          // Criar grupo padrão automaticamente se não existir nenhum grupo
          const { data: existingGroups } = await supabase.functions.invoke('members-area-groups', {
            body: { action: 'list', product_id: productId }
          });

          const groupsList = existingGroups?.groups || existingGroups?.data || [];
          
          if (!groupsList.length) {
            const { error: createGroupError } = await supabase.functions.invoke('members-area-groups', {
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

            if (createGroupError) {
              console.error("[useMembersArea] Error creating default group:", createGroupError);
            } else {
              console.log("[useMembersArea] Default group 'Padrão' created automatically");
            }
          }
        } catch (accessError) {
          console.error("[useMembersArea] Error in members area setup:", accessError);
          // Não falha a operação principal se o setup automático falhar
        }
      }

      setSettings({ enabled, settings: newSettings || settings.settings });
      toast.success("Configurações atualizadas!");
    } catch (error) {
      console.error("[useMembersArea] Error updating settings:", error);
      toast.error("Erro ao atualizar configurações");
    } finally {
      setIsSaving(false);
    }
  }, [productId, settings.settings]);

  const addModule = useCallback(async (title: string, description?: string, coverImageUrl?: string): Promise<MemberModule | null> => {
    if (!productId) return null;

    setIsSaving(true);
    try {
      const maxPosition = modules.length > 0 ? Math.max(...modules.map(m => m.position)) + 1 : 0;

      const { data, error } = await supabase
        .from("product_member_modules")
        .insert({
          product_id: productId,
          title,
          description: description || null,
          cover_image_url: coverImageUrl || null,
          position: maxPosition,
        })
        .select()
        .single();

      if (error) throw error;

      setModules(prev => [...prev, { ...data, contents: [] }]);
      toast.success("Módulo criado!");
      return data;
    } catch (error) {
      console.error("[useMembersArea] Error adding module:", error);
      toast.error("Erro ao criar módulo");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [productId, modules]);

  const updateModule = useCallback(async (id: string, data: Partial<MemberModule>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("product_member_modules")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      setModules(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
      toast.success("Módulo atualizado!");
    } catch (error) {
      console.error("[useMembersArea] Error updating module:", error);
      toast.error("Erro ao atualizar módulo");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const deleteModule = useCallback(async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("product_member_modules")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setModules(prev => prev.filter(m => m.id !== id));
      toast.success("Módulo excluído!");
    } catch (error) {
      console.error("[useMembersArea] Error deleting module:", error);
      toast.error("Erro ao excluir módulo");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const reorderModules = useCallback(async (orderedIds: string[]) => {
    try {
      const updates = orderedIds.map((id, index) => 
        supabase
          .from("product_member_modules")
          .update({ position: index })
          .eq("id", id)
      );

      await Promise.all(updates);

      setModules(prev => {
        const moduleMap = new Map(prev.map(m => [m.id, m]));
        return orderedIds.map((id, index) => ({
          ...moduleMap.get(id)!,
          position: index,
        }));
      });
    } catch (error) {
      console.error("[useMembersArea] Error reordering modules:", error);
      toast.error("Erro ao reordenar módulos");
    }
  }, []);

  const addContent = useCallback(async (
    moduleId: string, 
    data: Omit<MemberContent, "id" | "module_id" | "position" | "created_at" | "updated_at">
  ): Promise<MemberContent | null> => {
    setIsSaving(true);
    try {
      const moduleContents = modules.find(m => m.id === moduleId)?.contents || [];
      const maxPosition = moduleContents.length > 0 ? Math.max(...moduleContents.map(c => c.position)) + 1 : 0;

      const { data: newContent, error } = await supabase
        .from("product_member_content")
        .insert({
          module_id: moduleId,
          position: maxPosition,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;

      const normalizedContent = {
        ...newContent,
        content_type: normalizeContentType(newContent.content_type),
      } as MemberContent;

      setModules(prev => prev.map(m => 
        m.id === moduleId 
          ? { ...m, contents: [...m.contents, normalizedContent] }
          : m
      ));
      toast.success("Conteúdo adicionado!");
      return normalizedContent;
    } catch (error) {
      console.error("[useMembersArea] Error adding content:", error);
      toast.error("Erro ao adicionar conteúdo");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [modules]);

  const updateContent = useCallback(async (id: string, data: Partial<MemberContent>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("product_member_content")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      setModules(prev => prev.map(m => ({
        ...m,
        contents: m.contents.map(c => c.id === id ? { ...c, ...data } : c),
      })));
      toast.success("Conteúdo atualizado!");
    } catch (error) {
      console.error("[useMembersArea] Error updating content:", error);
      toast.error("Erro ao atualizar conteúdo");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const deleteContent = useCallback(async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("product_member_content")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setModules(prev => prev.map(m => ({
        ...m,
        contents: m.contents.filter(c => c.id !== id),
      })));
      toast.success("Conteúdo excluído!");
    } catch (error) {
      console.error("[useMembersArea] Error deleting content:", error);
      toast.error("Erro ao excluir conteúdo");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const reorderContents = useCallback(async (moduleId: string, orderedIds: string[]) => {
    try {
      const updates = orderedIds.map((id, index) => 
        supabase
          .from("product_member_content")
          .update({ position: index })
          .eq("id", id)
      );

      await Promise.all(updates);

      setModules(prev => prev.map(m => {
        if (m.id !== moduleId) return m;
        const contentMap = new Map(m.contents.map(c => [c.id, c]));
        return {
          ...m,
          contents: orderedIds.map((id, index) => ({
            ...contentMap.get(id)!,
            position: index,
          })),
        };
      }));
    } catch (error) {
      console.error("[useMembersArea] Error reordering contents:", error);
      toast.error("Erro ao reordenar conteúdos");
    }
  }, []);

  return {
    isLoading,
    isSaving,
    settings,
    modules,
    updateSettings,
    fetchModules,
    addModule,
    updateModule,
    deleteModule,
    reorderModules,
    addContent,
    updateContent,
    deleteContent,
    reorderContents,
  };
}

/**
 * Normalize legacy content types to unified system
 * - "mixed" = Kiwify-style (video + body + attachments)
 * - "video" = video only
 * - "text" = text/html only
 * All other types map to "mixed" for flexibility
 */
function normalizeContentType(type: string): ContentDisplayType {
  switch (type) {
    case "mixed":
    case "video":
    case "text":
      return type;
    case "pdf":
    case "download":
    case "link":
      // Legacy types become mixed for flexible display
      return "mixed";
    default:
      return "mixed";
  }
}
