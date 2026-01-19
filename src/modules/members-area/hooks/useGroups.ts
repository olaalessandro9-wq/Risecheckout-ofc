/**
 * useGroups Hook
 * Manages access groups for a product's members area
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';
import { groupsService, type ProductOffer } from '../services/groups.service';
import type {
  MemberGroup,
  GroupWithPermissions,
  CreateGroupInput,
  UpdateGroupInput,
  UpdatePermissionsInput,
} from '../types';

const log = createLogger("useGroups");

interface UseGroupsReturn {
  groups: MemberGroup[];
  offers: ProductOffer[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  fetchOffers: () => Promise<void>;
  getGroup: (groupId: string) => Promise<GroupWithPermissions | null>;
  createGroup: (input: Omit<CreateGroupInput, 'product_id'>) => Promise<MemberGroup | null>;
  updateGroup: (groupId: string, input: UpdateGroupInput) => Promise<boolean>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  updatePermissions: (input: UpdatePermissionsInput, options?: { silent?: boolean }) => Promise<boolean>;
  linkOffers: (groupId: string, offerIds: string[], options?: { silent?: boolean }) => Promise<boolean>;
}

export function useGroups(productId: string | undefined): UseGroupsReturn {
  const [groups, setGroups] = useState<MemberGroup[]>([]);
  const [offers, setOffers] = useState<ProductOffer[]>([]);
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

  const fetchOffers = useCallback(async () => {
    if (!productId) return;

    const { data, error: fetchError } = await groupsService.listOffers(productId);

    if (fetchError) {
      log.error("Erro ao carregar ofertas:", fetchError);
    } else if (data) {
      setOffers(data);
    }
  }, [productId]);

  useEffect(() => {
    fetchGroups();
    fetchOffers();
  }, [fetchGroups, fetchOffers]);

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
      toast.error(`Erro ao criar grupo: ${createError}`);
      setIsSaving(false);
      return null;
    }

    if (data) {
      // Se o grupo foi criado como padrão, atualizar os outros grupos no estado local
      if (input.is_default === true) {
        setGroups(prev => [...prev.map(g => ({ ...g, is_default: false })), data]);
      } else {
        setGroups(prev => [...prev, data]);
      }
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
      toast.error(`Erro ao atualizar grupo: ${updateError}`);
      setIsSaving(false);
      return false;
    }

    if (data) {
      // Se o grupo foi definido como padrão, atualizar os outros grupos no estado local
      if (input.is_default === true) {
        setGroups(prev => prev.map(g => 
          g.id === groupId 
            ? data 
            : { ...g, is_default: false }
        ));
      } else {
        setGroups(prev => prev.map(g => g.id === groupId ? data : g));
      }
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
    input: UpdatePermissionsInput,
    options?: { silent?: boolean }
  ): Promise<boolean> => {
    setIsSaving(true);

    const { error: permError } = await groupsService.updatePermissions(input);

    if (permError) {
      toast.error('Erro ao atualizar permissões');
      setIsSaving(false);
      return false;
    }

    if (!options?.silent) {
      toast.success('Permissões atualizadas');
    }
    setIsSaving(false);
    return true;
  }, []);

  const linkOffers = useCallback(async (
    groupId: string,
    offerIds: string[],
    options?: { silent?: boolean }
  ): Promise<boolean> => {
    setIsSaving(true);

    const { error: linkError } = await groupsService.linkOffers(groupId, offerIds);

    if (linkError) {
      if (!options?.silent) {
        toast.error('Erro ao vincular ofertas');
      }
      setIsSaving(false);
      return false;
    }

    // Refresh offers list after linking
    await fetchOffers();
    setIsSaving(false);
    return true;
  }, [fetchOffers]);

  return {
    groups,
    offers,
    isLoading,
    isSaving,
    error,
    fetchGroups,
    fetchOffers,
    getGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    updatePermissions,
    linkOffers,
  };
}
