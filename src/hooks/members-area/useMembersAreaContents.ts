/**
 * Members Area Contents Hook
 * Handles CRUD operations for content items within modules via Edge Function
 * 
 * REFACTORED: Uses dispatch from Reducer for state management
 * 
 * @see RISE Protocol V3 - Single Source of Truth
 */

import { useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import { normalizeContentType } from "@/modules/members-area/utils";
import type { MemberContent, MemberModuleWithContents } from "./types";
import type { MembersAreaAction } from "./membersAreaReducer";

const log = createLogger("MembersAreaContents");

interface UseMembersAreaContentsProps {
  modules: MemberModuleWithContents[];
  dispatch: React.Dispatch<MembersAreaAction>;
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
  dispatch,
}: UseMembersAreaContentsProps): UseMembersAreaContentsReturn {
  // Ref para rollback em caso de erro
  const previousModulesRef = useRef<MemberModuleWithContents[]>([]);

  const addContent = useCallback(async (
    moduleId: string, 
    data: Omit<MemberContent, "id" | "module_id" | "position" | "created_at" | "updated_at">
  ): Promise<MemberContent | null> => {
    dispatch({ type: 'SET_SAVING', isSaving: true });
    try {
      const { data: result, error } = await api.call<{ success?: boolean; error?: string; data?: MemberContent }>("content-crud", {
        action: "create",
        moduleId,
        data,
      });

      if (error) throw new Error(error.message);
      if (!result?.success || !result.data) throw new Error(result?.error || "Failed to create content");

      const normalizedContent = {
        ...result.data,
        content_type: normalizeContentType(result.data.content_type),
      } as MemberContent;

      dispatch({ type: 'ADD_CONTENT', moduleId, content: normalizedContent });
      toast.success("Conteúdo adicionado!");
      return normalizedContent;
    } catch (error: unknown) {
      log.error("Error adding content", error);
      toast.error("Erro ao adicionar conteúdo");
      return null;
    } finally {
      dispatch({ type: 'SET_SAVING', isSaving: false });
    }
  }, [dispatch]);

  const updateContent = useCallback(async (id: string, data: Partial<MemberContent>) => {
    dispatch({ type: 'SET_SAVING', isSaving: true });
    try {
      const { data: result, error } = await api.call<{ success?: boolean; error?: string }>("content-crud", {
        action: "update",
        contentId: id,
        data,
      });

      if (error) throw new Error(error.message);
      if (!result?.success) throw new Error(result?.error || "Failed to update content");

      dispatch({ type: 'UPDATE_CONTENT', id, data });
      toast.success("Conteúdo atualizado!");
    } catch (error: unknown) {
      log.error("Error updating content", error);
      toast.error("Erro ao atualizar conteúdo");
    } finally {
      dispatch({ type: 'SET_SAVING', isSaving: false });
    }
  }, [dispatch]);

  const deleteContent = useCallback(async (id: string) => {
    dispatch({ type: 'SET_SAVING', isSaving: true });
    try {
      const { data: result, error } = await api.call<{ success?: boolean; error?: string }>("content-crud", {
        action: "delete",
        contentId: id,
      });

      if (error) throw new Error(error.message);
      if (!result?.success) throw new Error(result?.error || "Failed to delete content");

      dispatch({ type: 'DELETE_CONTENT', id });
      toast.success("Conteúdo excluído!");
    } catch (error: unknown) {
      log.error("Error deleting content", error);
      toast.error("Erro ao excluir conteúdo");
    } finally {
      dispatch({ type: 'SET_SAVING', isSaving: false });
    }
  }, [dispatch]);

  const reorderContents = useCallback(async (moduleId: string, orderedIds: string[]) => {
    // Salvar estado anterior para rollback
    previousModulesRef.current = modules;

    // Update otimista
    dispatch({ type: 'REORDER_CONTENTS', moduleId, orderedIds });

    try {
      const { data: result, error } = await api.call<{ success?: boolean; error?: string }>("content-crud", {
        action: "reorder",
        moduleId,
        orderedIds,
      });

      if (error) throw new Error(error.message);
      if (!result?.success) throw new Error(result?.error || "Failed to reorder contents");
    } catch (error: unknown) {
      log.error("Error reordering contents", error);
      toast.error("Erro ao reordenar conteúdos");
      // Rollback
      dispatch({ type: 'SET_MODULES', modules: previousModulesRef.current });
    }
  }, [modules, dispatch]);

  return {
    addContent,
    updateContent,
    deleteContent,
    reorderContents,
  };
}
