/**
 * Members Area Hook - Facade
 * Composes settings, modules, and contents hooks into a single interface
 * 
 * @see RISE ARCHITECT PROTOCOL - Refatorado para compliance de 300 linhas
 */

import { useMembersAreaSettings } from "./useMembersAreaSettings";
import { useMembersAreaModules } from "./useMembersAreaModules";
import { useMembersAreaContents } from "./useMembersAreaContents";
import type { UseMembersAreaReturn } from "./types";

export function useMembersArea(productId: string | undefined): UseMembersAreaReturn {
  // Settings hook (handles loading, saving, fetch)
  const {
    isLoading,
    isSaving,
    setIsSaving,
    settings,
    modules,
    setModules,
    updateSettings,
    fetchData,
  } = useMembersAreaSettings(productId);

  // Modules CRUD hook
  const {
    addModule,
    updateModule,
    deleteModule,
    reorderModules,
  } = useMembersAreaModules({
    productId,
    modules,
    setModules,
    setIsSaving,
  });

  // Contents CRUD hook
  const {
    addContent,
    updateContent,
    deleteContent,
    reorderContents,
  } = useMembersAreaContents({
    modules,
    setModules,
    setIsSaving,
  });

  return {
    isLoading,
    isSaving,
    settings,
    modules,
    updateSettings,
    fetchModules: fetchData,
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
