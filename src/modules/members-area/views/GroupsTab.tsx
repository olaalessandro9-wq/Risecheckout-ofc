/**
 * GroupsTab - Manage access groups for a product's members area
 * Uses unified modal for creating/editing groups with modules and offers
 */

import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { GroupManager, UnifiedGroupModal } from '../components/shared';
import { useGroups } from '../hooks/useGroups';
import { useMembersArea } from '../hooks';
import type { MemberGroup, GroupPermission } from '../types';
import type { MemberModule } from '../types/module.types';

interface GroupsTabProps {
  productId?: string;
}

export function GroupsTab({ productId }: GroupsTabProps) {
  const {
    groups,
    isLoading,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroup,
    updatePermissions,
    offers,
    linkOffers,
  } = useGroups(productId);

  const { modules } = useMembersArea(productId);

  // State for unified modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedGroup, setSelectedGroup] = useState<MemberGroup | null>(null);
  const [groupPermissions, setGroupPermissions] = useState<GroupPermission[]>([]);
  const [isLoadingGroup, setIsLoadingGroup] = useState(false);

  // Handle opening modal for creating
  const handleCreateGroupUnified = useCallback(() => {
    setSelectedGroup(null);
    setGroupPermissions([]);
    setModalMode('create');
    setModalOpen(true);
  }, []);

  // Handle opening modal for editing - INSTANT OPEN, load details in background
  const handleEditGroup = useCallback(async (groupId: string) => {
    // Find group from local state for instant opening
    const localGroup = groups.find(g => g.id === groupId);
    
    if (localGroup) {
      // Open modal immediately with local data
      setSelectedGroup(localGroup);
      setGroupPermissions([]); // Will be populated when fetch completes
      setModalMode('edit');
      setModalOpen(true);
      setIsLoadingGroup(true);
      
      // Fetch full details in background
      const groupWithPermissions = await getGroup(groupId);
      
      if (groupWithPermissions) {
        setSelectedGroup(groupWithPermissions);
        setGroupPermissions(groupWithPermissions.permissions || []);
      }
      setIsLoadingGroup(false);
    }
  }, [getGroup, groups]);

  // Handle saving from unified modal - returns success boolean
  const handleSaveGroup = useCallback(async (data: {
    name: string;
    description?: string;
    is_default: boolean;
    permissions: { module_id: string; has_access: boolean }[];
    linkedOfferIds: string[];
  }): Promise<boolean> => {
    if (modalMode === 'create') {
      const newGroup = await createGroup({
        name: data.name,
        description: data.description,
        is_default: data.is_default,
      });
      
      if (newGroup) {
        // Save permissions (silent - toast já foi mostrado no createGroup)
        await updatePermissions({
          group_id: newGroup.id,
          permissions: data.permissions,
        }, { silent: true });
        // Link offers (silent)
        await linkOffers(newGroup.id, data.linkedOfferIds, { silent: true });
        return true;
      }
      return false;
    } else if (selectedGroup) {
      // Update group - VERIFICAR SUCESSO antes de continuar
      const success = await updateGroup(selectedGroup.id, {
        name: data.name,
        description: data.description,
        is_default: data.is_default,
      });
      
      // Só atualiza permissões e ofertas se o update do grupo teve sucesso
      if (success) {
        // Update permissions (silent - toast já foi mostrado no updateGroup)
        await updatePermissions({
          group_id: selectedGroup.id,
          permissions: data.permissions,
        }, { silent: true });
        // Update linked offers (silent)
        await linkOffers(selectedGroup.id, data.linkedOfferIds, { silent: true });
        return true;
      }
      return false;
    }
    return false;
  }, [modalMode, selectedGroup, createGroup, updateGroup, updatePermissions, linkOffers]);

  // Wrapper functions
  const handleCreateGroup = useCallback(async (data: { name: string; description?: string; is_default?: boolean }) => {
    await createGroup(data);
  }, [createGroup]);

  const handleUpdateGroup = useCallback(async (groupId: string, data: { name?: string; description?: string; is_default?: boolean }) => {
    await updateGroup(groupId, data);
  }, [updateGroup]);

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    await deleteGroup(groupId);
  }, [deleteGroup]);

  // Convert modules to the format expected
  const formattedModules: MemberModule[] = modules.map(m => ({
    id: m.id,
    product_id: m.product_id,
    title: m.title,
    description: m.description ?? null,
    cover_image_url: m.cover_image_url ?? null,
    width: null,
    height: null,
    position: m.position,
    is_active: m.is_active,
    created_at: m.created_at,
    updated_at: m.updated_at,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GroupManager
        groups={groups}
        isLoading={isLoading || isLoadingGroup}
        onCreateGroup={handleCreateGroup}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
        onEditGroup={handleEditGroup}
        onCreateGroupUnified={handleCreateGroupUnified}
      />

      <UnifiedGroupModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        group={selectedGroup}
        modules={formattedModules}
        offers={offers}
        permissions={groupPermissions}
        onSave={handleSaveGroup}
        isLoadingPermissions={isLoadingGroup}
      />
    </div>
  );
}
