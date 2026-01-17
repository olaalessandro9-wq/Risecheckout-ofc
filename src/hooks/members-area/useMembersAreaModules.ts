/**
 * Members Area Modules Hook
 * Handles CRUD operations for modules
 */

import { useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import type { MemberModule, MemberModuleWithContents } from "./types";

const log = createLogger("MembersAreaModules");

interface UseMembersAreaModulesProps {
  productId: string | undefined;
  modules: MemberModuleWithContents[];
  setModules: React.Dispatch<React.SetStateAction<MemberModuleWithContents[]>>;
  setIsSaving: (saving: boolean) => void;
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
  setModules,
  setIsSaving,
}: UseMembersAreaModulesProps): UseMembersAreaModulesReturn {

  const addModule = useCallback(async (
    title: string, 
    description?: string, 
    coverImageUrl?: string
  ): Promise<MemberModule | null> => {
    if (!productId) return null;

    setIsSaving(true);
    try {
      const { data, error } = await api.call<{ success?: boolean; error?: string; module?: MemberModule }>('members-area-modules', {
        action: 'create',
        productId,
        data: { title, description, cover_image_url: coverImageUrl },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Falha ao criar módulo');

      setModules(prev => [...prev, { ...data.module, contents: [] }]);
      toast.success("Módulo criado!");
      return data.module;
    } catch (error: unknown) {
      log.error("Error adding module", error);
      toast.error("Erro ao criar módulo");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [productId, setModules, setIsSaving]);

  const updateModule = useCallback(async (id: string, data: Partial<MemberModule>) => {
    setIsSaving(true);
    try {
      const { data: result, error } = await api.call<{ success?: boolean; error?: string }>('members-area-modules', {
        action: 'update',
        moduleId: id,
        data,
      });

      if (error) throw new Error(error.message);
      if (!result?.success) throw new Error(result?.error || 'Falha ao atualizar módulo');

      setModules(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
      toast.success("Módulo atualizado!");
    } catch (error: unknown) {
      log.error("Error updating module", error);
      toast.error("Erro ao atualizar módulo");
    } finally {
      setIsSaving(false);
    }
  }, [setModules, setIsSaving]);

  const deleteModule = useCallback(async (id: string) => {
    setIsSaving(true);
    try {
      const { data, error } = await api.call<{ success?: boolean; error?: string }>('members-area-modules', {
        action: 'delete',
        moduleId: id,
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Falha ao excluir módulo');

      setModules(prev => prev.filter(m => m.id !== id));
      toast.success("Módulo excluído!");
    } catch (error: unknown) {
      log.error("Error deleting module", error);
      toast.error("Erro ao excluir módulo");
    } finally {
      setIsSaving(false);
    }
  }, [setModules, setIsSaving]);

  const reorderModules = useCallback(async (orderedIds: string[]) => {
    let previousModules: MemberModuleWithContents[] = [];

    setModules(prev => {
      previousModules = prev;
      const moduleMap = new Map(prev.map(m => [m.id, m]));
      return orderedIds
        .map((id, index) => {
          const module = moduleMap.get(id);
          if (!module) return null;
          return { ...module, position: index };
        })
        .filter((m): m is MemberModuleWithContents => m !== null);
    });

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
      setModules(previousModules);
    }
  }, [productId, setModules]);

  return {
    addModule,
    updateModule,
    deleteModule,
    reorderModules,
  };
}
