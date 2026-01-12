/**
 * Members Area Modules Hook
 * Handles CRUD operations for modules
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      const sessionToken = localStorage.getItem('producer_session_token');
      const { data, error } = await supabase.functions.invoke('members-area-modules', {
        body: { action: 'create', productId, data: { title, description, cover_image_url: coverImageUrl } },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha ao criar módulo');

      setModules(prev => [...prev, { ...data.module, contents: [] }]);
      toast.success("Módulo criado!");
      return data.module;
    } catch (error) {
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
      const sessionToken = localStorage.getItem('producer_session_token');
      const { data: result, error } = await supabase.functions.invoke('members-area-modules', {
        body: { action: 'update', moduleId: id, data },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });

      if (error) throw error;
      if (!result?.success) throw new Error(result?.error || 'Falha ao atualizar módulo');

      setModules(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
      toast.success("Módulo atualizado!");
    } catch (error) {
      log.error("Error updating module", error);
      toast.error("Erro ao atualizar módulo");
    } finally {
      setIsSaving(false);
    }
  }, [setModules, setIsSaving]);

  const deleteModule = useCallback(async (id: string) => {
    setIsSaving(true);
    try {
      const sessionToken = localStorage.getItem('producer_session_token');
      const { data, error } = await supabase.functions.invoke('members-area-modules', {
        body: { action: 'delete', moduleId: id },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha ao excluir módulo');

      setModules(prev => prev.filter(m => m.id !== id));
      toast.success("Módulo excluído!");
    } catch (error) {
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
      const sessionToken = localStorage.getItem('producer_session_token');
      const { data, error } = await supabase.functions.invoke('members-area-modules', {
        body: { action: 'reorder', productId, orderedIds },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha ao reordenar');
    } catch (error) {
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
