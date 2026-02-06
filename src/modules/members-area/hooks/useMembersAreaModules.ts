/**
 * Members Area Modules CRUD Hook
 * Handles module creation, update, delete, and reordering
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - XState as SSOT
 */

import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import { membersAreaQueryKeys } from "./useMembersAreaSettings";
import type { MemberModule, ModuleWithContents } from "../types";
import type { MembersAreaMachineEvent } from "./machines";

const log = createLogger("MembersAreaModules");

interface UseMembersAreaModulesProps {
  productId: string | undefined;
  modules: ModuleWithContents[];
  dispatch: (event: MembersAreaMachineEvent) => void;
}

interface UseMembersAreaModulesReturn {
  addModule: (title: string, description?: string, coverImageUrl?: string) => Promise<MemberModule | null>;
  updateModule: (id: string, data: Partial<MemberModule>) => Promise<void>;
  deleteModule: (id: string) => Promise<void>;
  reorderModules: (orderedIds: string[]) => Promise<void>;
}

export function useMembersAreaModules({
  productId,
  modules,
  dispatch,
}: UseMembersAreaModulesProps): UseMembersAreaModulesReturn {
  const previousModulesRef = useRef<ModuleWithContents[]>([]);
  const queryClient = useQueryClient();

  const addModule = useCallback(async (
    title: string,
    description?: string,
    coverImageUrl?: string
  ): Promise<MemberModule | null> => {
    if (!productId) return null;

    const { data, error } = await api.call<{ success: boolean; module: MemberModule; error?: string }>('members-area-modules', {
      action: 'create',
      productId,
      data: {
        title,
        description,
        cover_image_url: coverImageUrl,
      },
    });

    if (error || !data?.success || !data.module) {
      log.error("Failed to create module", { error, data });
      toast.error("Erro ao criar módulo");
      return null;
    }

    const newModule: ModuleWithContents = {
      ...data.module,
      contents: [],
    };

    dispatch({ type: 'ADD_MODULE', module: newModule });
    toast.success("Módulo criado!");
    return data.module;
  }, [productId, dispatch]);

  const updateModule = useCallback(async (id: string, updateData: Partial<MemberModule>): Promise<void> => {
    const { error } = await api.call<{ success: boolean; error?: string }>('members-area-modules', {
      action: 'update',
      moduleId: id,
      data: updateData,
    });

    if (error) {
      log.error("Failed to update module", { error });
      toast.error("Erro ao atualizar módulo");
      return;
    }

    dispatch({ type: 'UPDATE_MODULE', id, data: updateData });
    // Invalidate cache for cross-view sync with builder
    if (productId) {
      queryClient.invalidateQueries({ 
        queryKey: membersAreaQueryKeys.modules(productId) 
      });
    }
    toast.success("Módulo atualizado!");
  }, [dispatch, productId, queryClient]);

  const deleteModule = useCallback(async (id: string): Promise<void> => {
    const { error } = await api.call<{ success: boolean; error?: string }>('members-area-modules', {
      action: 'delete',
      moduleId: id,
    });

    if (error) {
      log.error("Failed to delete module", { error });
      toast.error("Erro ao excluir módulo");
      return;
    }

    dispatch({ type: 'DELETE_MODULE', id });
    toast.success("Módulo excluído!");
  }, [dispatch]);

  const reorderModules = useCallback(async (orderedIds: string[]): Promise<void> => {
    if (!productId) return;

    // Store previous state for rollback
    previousModulesRef.current = [...modules];

    // Optimistic update
    dispatch({ type: 'REORDER_MODULES', orderedIds });

    const { error } = await api.call<{ success: boolean; error?: string }>('members-area-modules', {
      action: 'reorder',
      productId,
      orderedIds,
    });

    if (error) {
      log.error("Failed to reorder modules", { error });
      toast.error("Erro ao reordenar módulos");
      // Rollback
      dispatch({ type: 'SET_MODULES', modules: previousModulesRef.current });
      return;
    }

    toast.success("Módulos reordenados!");
  }, [productId, modules, dispatch]);

  return {
    addModule,
    updateModule,
    deleteModule,
    reorderModules,
  };
}
