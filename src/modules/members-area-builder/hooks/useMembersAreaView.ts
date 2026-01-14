/**
 * Members Area Builder - View State Hook
 * 
 * Responsible for:
 * - Selection state (section, menu item)
 * - View mode (desktop/mobile)
 * - Preview mode toggle
 * - Menu collapse toggle
 * - Settings update
 * 
 * @see RISE ARCHITECT PROTOCOL - Extracted for 300-line compliance
 */

import { useCallback } from 'react';
import type { 
  BuilderState, 
  ViewMode,
  MembersAreaBuilderSettings,
} from '../types/builder.types';

interface UseMembersAreaViewProps {
  setState: React.Dispatch<React.SetStateAction<BuilderState>>;
}

interface UseMembersAreaViewReturn {
  selectSection: (id: string | null) => void;
  selectMenuItem: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  togglePreviewMode: () => void;
  toggleMenuCollapse: () => void;
  updateSettings: (settings: Partial<MembersAreaBuilderSettings>) => Promise<void>;
}

/**
 * View state hook for Members Area Builder
 */
export function useMembersAreaView({
  setState,
}: UseMembersAreaViewProps): UseMembersAreaViewReturn {

  const selectSection = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedSectionId: id, selectedMenuItemId: null }));
  }, [setState]);

  const selectMenuItem = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedMenuItemId: id, selectedSectionId: null }));
  }, [setState]);

  const setViewMode = useCallback((mode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  }, [setState]);

  const togglePreviewMode = useCallback(() => {
    setState(prev => ({ ...prev, isPreviewMode: !prev.isPreviewMode }));
  }, [setState]);

  const toggleMenuCollapse = useCallback(() => {
    setState(prev => ({ ...prev, isMenuCollapsed: !prev.isMenuCollapsed }));
  }, [setState]);

  const updateSettings = useCallback(async (settings: Partial<MembersAreaBuilderSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
      isDirty: true,
    }));
  }, [setState]);

  return {
    selectSection,
    selectMenuItem,
    setViewMode,
    togglePreviewMode,
    toggleMenuCollapse,
    updateSettings,
  };
}
