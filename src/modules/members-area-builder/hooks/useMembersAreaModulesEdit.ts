/**
 * Members Area Builder - Modules Edit Hook
 * 
 * Responsible for:
 * - Update individual modules
 * - Selection state for module editing
 * 
 * @see RISE ARCHITECT PROTOCOL - Extracted for 300-line compliance
 */

import { useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { BuilderState, MemberModule } from '../types/builder.types';

interface ModuleUpdateResponse {
  success?: boolean;
  error?: string;
}

interface UseMembersAreaModulesEditProps {
  setState: React.Dispatch<React.SetStateAction<BuilderState>>;
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
  setState,
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
      
      setState(prev => ({
        ...prev,
        modules: prev.modules.map(m => m.id === id ? { ...m, ...moduleData } : m),
      }));
      
      toast.success('Módulo atualizado');
    } catch (error: unknown) {
      console.error('[useMembersAreaBuilder] Update module error:', error);
      toast.error('Erro ao atualizar módulo');
    }
  }, [setState]);

  const selectModule = useCallback((id: string | null) => {
    setState(prev => ({ 
      ...prev, 
      selectedModuleId: id,
      isEditingModule: id !== null,
    }));
  }, [setState]);

  const setEditingModule = useCallback((isEditing: boolean) => {
    setState(prev => ({ 
      ...prev, 
      isEditingModule: isEditing,
      selectedModuleId: isEditing ? prev.selectedModuleId : null,
    }));
  }, [setState]);

  return {
    updateModule,
    selectModule,
    setEditingModule,
  };
}
