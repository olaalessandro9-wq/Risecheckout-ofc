/**
 * Members Area Contents CRUD Hook
 * Handles content creation, update, delete, and reordering within modules
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - XState as SSOT
 */

import { useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import type { MemberContent, ModuleWithContents } from "../types";
import type { MembersAreaMachineEvent } from "./machines";

const log = createLogger("MembersAreaContents");

interface UseMembersAreaContentsProps {
  modules: ModuleWithContents[];
  dispatch: (event: MembersAreaMachineEvent) => void;
}

interface UseMembersAreaContentsReturn {
  addContent: (moduleId: string, data: Omit<MemberContent, "id" | "module_id" | "position" | "created_at" | "updated_at">) => Promise<MemberContent | null>;
  updateContent: (id: string, data: Partial<MemberContent>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  reorderContents: (moduleId: string, orderedIds: string[]) => Promise<void>;
}

export function useMembersAreaContents({
  modules,
  dispatch,
}: UseMembersAreaContentsProps): UseMembersAreaContentsReturn {
  const previousModulesRef = useRef<ModuleWithContents[]>([]);

  const addContent = useCallback(async (
    moduleId: string,
    data: Omit<MemberContent, "id" | "module_id" | "position" | "created_at" | "updated_at">
  ): Promise<MemberContent | null> => {
    const targetModule = modules.find(m => m.id === moduleId);
    if (!targetModule) {
      log.error("Module not found", { moduleId });
      return null;
    }

    const position = targetModule.contents.length;
    const { data: result, error } = await api.call<{ success: boolean; data: MemberContent; error?: string }>('content-crud', {
      action: 'create',
      moduleId,
      data: {
        ...data,
        position,
      },
    });

    if (error || !result?.success || !result.data) {
      log.error("Failed to create content", { error, result });
      toast.error("Erro ao criar conteúdo");
      return null;
    }

    dispatch({ type: 'ADD_CONTENT', moduleId, content: result.data });
    toast.success("Conteúdo criado!");
    return result.data;
  }, [modules, dispatch]);

  const updateContent = useCallback(async (id: string, data: Partial<MemberContent>): Promise<void> => {
    const { error } = await api.call<{ success: boolean; error?: string }>('content-crud', {
      action: 'update',
      contentId: id,
      data,
    });

    if (error) {
      log.error("Failed to update content", { error });
      toast.error("Erro ao atualizar conteúdo");
      return;
    }

    dispatch({ type: 'UPDATE_CONTENT', id, data });
    toast.success("Conteúdo atualizado!");
  }, [dispatch]);

  const deleteContent = useCallback(async (id: string): Promise<void> => {
    const { error } = await api.call<{ success: boolean; error?: string }>('content-crud', {
      action: 'delete',
      contentId: id,
    });

    if (error) {
      log.error("Failed to delete content", { error });
      toast.error("Erro ao excluir conteúdo");
      return;
    }

    dispatch({ type: 'DELETE_CONTENT', id });
    toast.success("Conteúdo excluído!");
  }, [dispatch]);

  const reorderContents = useCallback(async (moduleId: string, orderedIds: string[]): Promise<void> => {
    // Store previous state for rollback
    previousModulesRef.current = [...modules];

    // Optimistic update
    dispatch({ type: 'REORDER_CONTENTS', moduleId, orderedIds });

    const { error } = await api.call<{ success: boolean; error?: string }>('content-crud', {
      action: 'reorder',
      moduleId,
      orderedIds,
    });

    if (error) {
      log.error("Failed to reorder contents", { error });
      toast.error("Erro ao reordenar conteúdos");
      // Rollback
      dispatch({ type: 'SET_MODULES', modules: previousModulesRef.current });
      return;
    }

    toast.success("Conteúdos reordenados!");
  }, [modules, dispatch]);

  return {
    addContent,
    updateContent,
    deleteContent,
    reorderContents,
  };
}
