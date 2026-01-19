/**
 * Members Area Builder - Modules Edit Hook
 * 
 * Responsible for:
 * - Update individual modules
 * - Selection state for module editing
 * 
 * REFACTORED: Uses dispatch from Reducer
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Source of Truth
 */

import { useCallback } from 'react';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import { toast } from 'sonner';
import type { MemberModule } from '../types/builder.types';
import type { BuilderAction } from '../state/builderReducer';

const log = createLogger("UseMembersAreaModulesEdit");

interface ModuleUpdateResponse {
  success?: boolean;
  error?: string;
}

interface UseMembersAreaModulesEditProps {
  dispatch: React.Dispatch<BuilderAction>;
}

interface UseMembersAreaModulesEditReturn {
  updateModule: (id: string, moduleData: Partial<MemberModule>) => Promise<void>;
  selectModule: (id: string | null) => void;
  setEditingModule: (isEditing: boolean) => void;
}

/**
 * Modules editing hook for Members Area Builder
 */
export function useMembersAreaModulesEdit({
  dispatch,
}: UseMembersAreaModulesEditProps): UseMembersAreaModulesEditReturn {

  const updateModule = useCallback(async (id: string, moduleData: Partial<MemberModule>) => {
    try {
      const { data: result, error } = await api.call<ModuleUpdateResponse>('members-area-modules', {
        action: 'update',
        moduleId: id,
        data: moduleData,
      });
      
      if (error || !result?.success) {
        throw new Error(result?.error || error?.message || 'Falha ao atualizar módulo');
      }
      
      dispatch({ type: 'UPDATE_MODULE', id, data: moduleData });
      
      toast.success('Módulo atualizado');
    } catch (error: unknown) {
      log.error("Update module error:", error);
      toast.error('Erro ao atualizar módulo');
    }
  }, [dispatch]);

  const selectModule = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_MODULE', id });
  }, [dispatch]);

  const setEditingModule = useCallback((isEditing: boolean) => {
    dispatch({ type: 'SET_EDITING_MODULE', isEditing });
  }, [dispatch]);

  return {
    updateModule,
    selectModule,
    setEditingModule,
  };
}
