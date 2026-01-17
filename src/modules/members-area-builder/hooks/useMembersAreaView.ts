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
 * REFACTORED: Uses dispatch from Reducer
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Source of Truth
 */

import { useCallback } from 'react';
import type { 
  ViewMode,
  MembersAreaBuilderSettings,
} from '../types/builder.types';
import type { BuilderAction } from '../state/builderReducer';

interface UseMembersAreaViewProps {
  dispatch: React.Dispatch<BuilderAction>;
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
  dispatch,
}: UseMembersAreaViewProps): UseMembersAreaViewReturn {

  const selectSection = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_SECTION', id });
  }, [dispatch]);

  const selectMenuItem = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_MENU_ITEM', id });
  }, [dispatch]);

  const setViewMode = useCallback((mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', mode });
  }, [dispatch]);

  const togglePreviewMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_PREVIEW_MODE' });
  }, [dispatch]);

  const toggleMenuCollapse = useCallback(() => {
    dispatch({ type: 'TOGGLE_MENU_COLLAPSE' });
  }, [dispatch]);

  const updateSettings = useCallback(async (settings: Partial<MembersAreaBuilderSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings });
  }, [dispatch]);

  return {
    selectSection,
    selectMenuItem,
    setViewMode,
    togglePreviewMode,
    toggleMenuCollapse,
    updateSettings,
  };
}
