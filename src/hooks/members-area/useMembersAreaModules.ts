/**
 * Members Area Modules Hook
 * Handles CRUD operations for modules
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MemberModule, MemberModuleWithContents } from "./types";

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
      console.error("[useMembersAreaModules] Error adding module:", error);
      toast.error("Erro ao criar módulo");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [productId, modules, setModules, setIsSaving]);

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
      console.error("[useMembersAreaModules] Error updating module:", error);
      toast.error("Erro ao atualizar módulo");
    } finally {
      setIsSaving(false);
    }
  }, [setModules, setIsSaving]);

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
      console.error("[useMembersAreaModules] Error deleting module:", error);
      toast.error("Erro ao excluir módulo");
    } finally {
      setIsSaving(false);
    }
  }, [setModules, setIsSaving]);

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
      console.error("[useMembersAreaModules] Error reordering modules:", error);
      toast.error("Erro ao reordenar módulos");
    }
  }, [setModules]);

  return {
    addModule,
    updateModule,
    deleteModule,
    reorderModules,
  };
}
