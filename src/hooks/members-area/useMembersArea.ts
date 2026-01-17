/**
 * Members Area Hook - Facade
 * Composes settings, modules, and contents hooks into a single interface
 * 
 * REFACTORED: Uses dispatch from Reducer for Single Source of Truth
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - State Management via Reducer
 */

import { useMembersAreaSettings } from "./useMembersAreaSettings";
import { useMembersAreaModules } from "./useMembersAreaModules";
import { useMembersAreaContents } from "./useMembersAreaContents";
import type { UseMembersAreaReturn } from "./types";

export function useMembersArea(productId: string | undefined): UseMembersAreaReturn {
  // Settings hook (handles loading, saving, fetch, dispatch)
  const {
    isLoading,
    isSaving,
    settings,
    modules,
    dispatch,
    updateSettings,
    fetchData,
  } = useMembersAreaSettings(productId);

  // Modules CRUD hook - uses dispatch
  const {
    addModule,
    updateModule,
    deleteModule,
    reorderModules,
  } = useMembersAreaModules({
    productId,
    modules,
    dispatch,
  });

  // Contents CRUD hook - uses dispatch
  const {
    addContent,
    updateContent,
    deleteContent,
    reorderContents,
  } = useMembersAreaContents({
    modules,
    dispatch,
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
