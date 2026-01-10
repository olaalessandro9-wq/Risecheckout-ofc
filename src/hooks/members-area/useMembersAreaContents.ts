/**
 * Members Area Contents Hook
 * Handles CRUD operations for content items within modules
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
      log.error("Error adding content", error);
      toast.error("Erro ao adicionar conteúdo");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [modules, setModules, setIsSaving]);

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
      log.error("Error updating content", error);
      toast.error("Erro ao atualizar conteúdo");
    } finally {
      setIsSaving(false);
    }
  }, [setModules, setIsSaving]);

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
      log.error("Error deleting content", error);
      toast.error("Erro ao excluir conteúdo");
    } finally {
      setIsSaving(false);
    }
  }, [setModules, setIsSaving]);

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
      log.error("Error reordering contents", error);
      toast.error("Erro ao reordenar conteúdos");
    }
  }, [setModules]);

  return {
    addContent,
    updateContent,
    deleteContent,
    reorderContents,
  };
}
