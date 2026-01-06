/**
 * GroupsTab - Manage access groups for a product's members area
 */

import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { GroupManager } from '@/components/members-area/GroupManager';
import { GroupPermissionsEditor } from '@/components/members-area/GroupPermissionsEditor';
import { useGroups } from '../hooks/useGroups';
import { useMembersArea } from '@/hooks/useMembersArea';
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
  } = useGroups(productId);

  const { modules } = useMembersArea(productId);

  // State for permissions editor
  const [selectedGroup, setSelectedGroup] = useState<MemberGroup | null>(null);
  const [groupPermissions, setGroupPermissions] = useState<GroupPermission[]>([]);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  // Handle opening permissions editor
  const handleManagePermissions = useCallback(async (groupId: string) => {
    setIsLoadingPermissions(true);
    
    const groupWithPermissions = await getGroup(groupId);
    
    if (groupWithPermissions) {
      setSelectedGroup(groupWithPermissions);
      setGroupPermissions(groupWithPermissions.permissions || []);
      setIsPermissionsOpen(true);
    }
    
    setIsLoadingPermissions(false);
  }, [getGroup]);

  // Handle saving permissions
  const handleSavePermissions = useCallback(async (
    permissions: { module_id: string; has_access: boolean }[]
  ) => {
    if (!selectedGroup) return;

    await updatePermissions({
      group_id: selectedGroup.id,
      permissions,
    });
  }, [selectedGroup, updatePermissions]);

  // Wrapper functions to match GroupManager's expected signature (returns void)
  const handleCreateGroup = useCallback(async (data: { name: string; description?: string; is_default?: boolean }) => {
    await createGroup(data);
  }, [createGroup]);

  const handleUpdateGroup = useCallback(async (groupId: string, data: { name?: string; description?: string; is_default?: boolean }) => {
    await updateGroup(groupId, data);
  }, [updateGroup]);

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    await deleteGroup(groupId);
  }, [deleteGroup]);

  // Convert modules to the format expected by GroupPermissionsEditor
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
        isLoading={isLoading || isLoadingPermissions}
        onCreateGroup={handleCreateGroup}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
        onManagePermissions={handleManagePermissions}
      />

      <GroupPermissionsEditor
        open={isPermissionsOpen}
        onOpenChange={setIsPermissionsOpen}
        group={selectedGroup}
        modules={formattedModules}
        permissions={groupPermissions}
        onSave={handleSavePermissions}
      />
    </div>
  );
}
