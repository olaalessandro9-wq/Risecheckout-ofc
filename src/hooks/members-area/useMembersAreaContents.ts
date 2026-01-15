/**
 * Members Area Contents Hook
 * Handles CRUD operations for content items within modules via Edge Function
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import { normalizeContentType } from "@/modules/members-area/utils";
import type { MemberContent, MemberModuleWithContents } from "./types";

const log = createLogger("MembersAreaContents");

interface UseMembersAreaContentsProps {
  modules: MemberModuleWithContents[];
  setModules: React.Dispatch<React.SetStateAction<MemberModuleWithContents[]>>;
  setIsSaving: (saving: boolean) => void;
}

interface UseMembersAreaContentsReturn {
  addContent: (
    moduleId: string, 
    data: Omit<MemberContent, "id" | "module_id" | "position" | "created_at" | "updated_at">
  ) => Promise<MemberContent | null>;
  updateContent: (id: string, data: Partial<MemberContent>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  reorderContents: (moduleId: string, orderedIds: string[]) => Promise<void>;
}

export function useMembersAreaContents({
  modules,
  setModules,
  setIsSaving,
}: UseMembersAreaContentsProps): UseMembersAreaContentsReturn {

  const addContent = useCallback(async (
    moduleId: string, 
    data: Omit<MemberContent, "id" | "module_id" | "position" | "created_at" | "updated_at">
  ): Promise<MemberContent | null> => {
    setIsSaving(true);
    const sessionToken = localStorage.getItem('producer_session_token');
    try {
      const { data: result, error } = await supabase.functions.invoke("content-crud", {
        body: {
          action: "create",
          moduleId,
          data,
        },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });

      if (error) throw error;
      if (!result?.success) throw new Error(result?.error || "Failed to create content");

      const newContent = result.data;
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
    } catch (error: unknown) {
      log.error("Error adding content", error);
      toast.error("Erro ao adicionar conteúdo");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [setModules, setIsSaving]);

  const updateContent = useCallback(async (id: string, data: Partial<MemberContent>) => {
    setIsSaving(true);
    const sessionToken = localStorage.getItem('producer_session_token');
    try {
      const { data: result, error } = await supabase.functions.invoke("content-crud", {
        body: {
          action: "update",
          contentId: id,
          data,
        },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });

      if (error) throw error;
      if (!result?.success) throw new Error(result?.error || "Failed to update content");

      setModules(prev => prev.map(m => ({
        ...m,
        contents: m.contents.map(c => c.id === id ? { ...c, ...data } : c),
      })));
      toast.success("Conteúdo atualizado!");
    } catch (error: unknown) {
      log.error("Error updating content", error);
      toast.error("Erro ao atualizar conteúdo");
    } finally {
      setIsSaving(false);
    }
  }, [setModules, setIsSaving]);

  const deleteContent = useCallback(async (id: string) => {
    setIsSaving(true);
    const sessionToken = localStorage.getItem('producer_session_token');
    try {
      const { data: result, error } = await supabase.functions.invoke("content-crud", {
        body: {
          action: "delete",
          contentId: id,
        },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });

      if (error) throw error;
      if (!result?.success) throw new Error(result?.error || "Failed to delete content");

      setModules(prev => prev.map(m => ({
        ...m,
        contents: m.contents.filter(c => c.id !== id),
      })));
      toast.success("Conteúdo excluído!");
    } catch (error: unknown) {
      log.error("Error deleting content", error);
      toast.error("Erro ao excluir conteúdo");
    } finally {
      setIsSaving(false);
    }
  }, [setModules, setIsSaving]);

  const reorderContents = useCallback(async (moduleId: string, orderedIds: string[]) => {
    // 1. Salvar estado anterior para possível rollback
    let previousModules: MemberModuleWithContents[] = [];

    // 2. Atualizar state IMEDIATAMENTE (otimista - elimina animação duplicada)
    setModules(prev => {
      previousModules = prev;
      return prev.map(m => {
        if (m.id !== moduleId) return m;
        const contentMap = new Map(m.contents.map(c => [c.id, c]));
        return {
          ...m,
          contents: orderedIds
            .map((id, index) => {
              const content = contentMap.get(id);
              if (!content) return null;
              return { ...content, position: index };
            })
            .filter((c): c is MemberContent => c !== null),
        };
      });
    });

    // 3. Persistir em background via Edge Function
    const sessionToken = localStorage.getItem('producer_session_token');
    try {
      const { data: result, error } = await supabase.functions.invoke("content-crud", {
        body: {
          action: "reorder",
          moduleId,
          orderedIds,
        },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });

      if (error) throw error;
      if (!result?.success) throw new Error(result?.error || "Failed to reorder contents");
    } catch (error: unknown) {
      // 4. Rollback em caso de erro
      log.error("Error reordering contents", error);
      toast.error("Erro ao reordenar conteúdos");
      setModules(previousModules);
    }
  }, [setModules]);

  return {
    addContent,
    updateContent,
    deleteContent,
    reorderContents,
  };
}
