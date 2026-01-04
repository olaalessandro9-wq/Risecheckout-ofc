/**
 * useGroups Hook
 * Manages access groups for a product's members area
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { groupsService } from '../services/groups.service';
import type {
  MemberGroup,
  GroupWithPermissions,
  CreateGroupInput,
  UpdateGroupInput,
  UpdatePermissionsInput,
} from '../types';

interface UseGroupsReturn {
  groups: MemberGroup[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  getGroup: (groupId: string) => Promise<GroupWithPermissions | null>;
  createGroup: (input: Omit<CreateGroupInput, 'product_id'>) => Promise<MemberGroup | null>;
  updateGroup: (groupId: string, input: UpdateGroupInput) => Promise<boolean>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  updatePermissions: (input: UpdatePermissionsInput) => Promise<boolean>;
}

export function useGroups(productId: string | undefined): UseGroupsReturn {
  const [groups, setGroups] = useState<MemberGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!productId) return;

    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await groupsService.list(productId);

    if (fetchError) {
      setError(fetchError);
      toast.error('Erro ao carregar grupos');
    } else if (data) {
      setGroups(data);
    }

    setIsLoading(false);
  }, [productId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const getGroup = useCallback(async (groupId: string): Promise<GroupWithPermissions | null> => {
    const { data, error: fetchError } = await groupsService.get(groupId);

    if (fetchError) {
      toast.error('Erro ao carregar grupo');
      return null;
    }

    return data;
  }, []);

  const createGroup = useCallback(async (
    input: Omit<CreateGroupInput, 'product_id'>
  ): Promise<MemberGroup | null> => {
    if (!productId) return null;

    setIsSaving(true);

    const { data, error: createError } = await groupsService.create({
      ...input,
      product_id: productId,
    });

    if (createError) {
      toast.error('Erro ao criar grupo');
      setIsSaving(false);
      return null;
    }

    if (data) {
      setGroups(prev => [...prev, data]);
      toast.success('Grupo criado com sucesso');
    }

    setIsSaving(false);
    return data;
  }, [productId]);

  const updateGroup = useCallback(async (
    groupId: string,
    input: UpdateGroupInput
  ): Promise<boolean> => {
    setIsSaving(true);

    const { data, error: updateError } = await groupsService.update(groupId, input);

    if (updateError) {
      toast.error('Erro ao atualizar grupo');
      setIsSaving(false);
      return false;
    }

    if (data) {
      setGroups(prev => prev.map(g => g.id === groupId ? data : g));
      toast.success('Grupo atualizado');
    }

    setIsSaving(false);
    return true;
  }, []);

  const deleteGroup = useCallback(async (groupId: string): Promise<boolean> => {
    setIsSaving(true);

    const { error: deleteError } = await groupsService.delete(groupId);

    if (deleteError) {
      toast.error('Erro ao excluir grupo');
      setIsSaving(false);
      return false;
    }

    setGroups(prev => prev.filter(g => g.id !== groupId));
    toast.success('Grupo excluído');

    setIsSaving(false);
    return true;
  }, []);

  const updatePermissions = useCallback(async (
    input: UpdatePermissionsInput
  ): Promise<boolean> => {
    setIsSaving(true);

    const { error: permError } = await groupsService.updatePermissions(input);

    if (permError) {
      toast.error('Erro ao atualizar permissões');
      setIsSaving(false);
      return false;
    }

    toast.success('Permissões atualizadas');
    setIsSaving(false);
    return true;
  }, []);

  return {
    groups,
    isLoading,
    isSaving,
    error,
    fetchGroups,
    getGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    updatePermissions,
  };
}
