/**
 * Members Area Modules Hook
 * Handles CRUD operations for modules
 * 
 * REFACTORED: Uses XState dispatch for state management
 * 
 * @see RISE Protocol V3 - Single Source of Truth via XState
 */

import { useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import type { MemberModule, MemberModuleWithContents } from "./types";
import type { MembersAreaMachineEvent } from "./machines";

const log = createLogger("MembersAreaModules");

interface UseMembersAreaModulesProps {
  productId: string | undefined;
  modules: MemberModuleWithContents[];
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
  // Ref para rollback em caso de erro
  const previousModulesRef = useRef<MemberModuleWithContents[]>([]);

  const addModule = useCallback(async (
    title: string, 
    description?: string, 
    coverImageUrl?: string
  ): Promise<MemberModule | null> => {
    if (!productId) return null;

    dispatch({ type: 'SET_SAVING', isSaving: true });
    try {
      const { data, error } = await api.call<{ success?: boolean; error?: string; module?: MemberModule }>('members-area-modules', {
        action: 'create',
        productId,
        data: { title, description, cover_image_url: coverImageUrl },
      });

      if (error) throw new Error(error.message);
      if (!data?.success || !data.module) throw new Error(data?.error || 'Falha ao criar módulo');

      dispatch({ type: 'ADD_MODULE', module: { ...data.module, contents: [] } });
      toast.success("Módulo criado!");
      return data.module;
    } catch (error: unknown) {
      log.error("Error adding module", error);
      toast.error("Erro ao criar módulo");
      return null;
    } finally {
      dispatch({ type: 'SET_SAVING', isSaving: false });
    }
  }, [productId, dispatch]);

  const updateModule = useCallback(async (id: string, data: Partial<MemberModule>) => {
    dispatch({ type: 'SET_SAVING', isSaving: true });
    try {
      const { data: result, error } = await api.call<{ success?: boolean; error?: string }>('members-area-modules', {
        action: 'update',
        moduleId: id,
        data,
      });

      if (error) throw new Error(error.message);
      if (!result?.success) throw new Error(result?.error || 'Falha ao atualizar módulo');

      dispatch({ type: 'UPDATE_MODULE', id, data });
      toast.success("Módulo atualizado!");
    } catch (error: unknown) {
      log.error("Error updating module", error);
      toast.error("Erro ao atualizar módulo");
    } finally {
      dispatch({ type: 'SET_SAVING', isSaving: false });
    }
  }, [dispatch]);

  const deleteModule = useCallback(async (id: string) => {
    dispatch({ type: 'SET_SAVING', isSaving: true });
    try {
      const { data, error } = await api.call<{ success?: boolean; error?: string }>('members-area-modules', {
        action: 'delete',
        moduleId: id,
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Falha ao excluir módulo');

      dispatch({ type: 'DELETE_MODULE', id });
      toast.success("Módulo excluído!");
    } catch (error: unknown) {
      log.error("Error deleting module", error);
      toast.error("Erro ao excluir módulo");
    } finally {
      dispatch({ type: 'SET_SAVING', isSaving: false });
    }
  }, [dispatch]);

  const reorderModules = useCallback(async (orderedIds: string[]) => {
    // Salvar estado anterior para rollback
    previousModulesRef.current = modules;

    // Update otimista
    dispatch({ type: 'REORDER_MODULES', orderedIds });

    try {
      const { data, error } = await api.call<{ success?: boolean; error?: string }>('members-area-modules', {
        action: 'reorder',
        productId,
        orderedIds,
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Falha ao reordenar');
    } catch (error: unknown) {
      log.error("Error reordering modules", error);
      toast.error("Erro ao reordenar módulos");
      // Rollback
      dispatch({ type: 'SET_MODULES', modules: previousModulesRef.current });
    }
  }, [productId, modules, dispatch]);

  return {
    addModule,
    updateModule,
    deleteModule,
    reorderModules,
  };
}
