/**
 * StudentsTab - Aba de gestão de alunos e grupos
 */

import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, FolderOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MemberGroup, BuyerWithGroups } from "@/modules/members-area/types";

// Componentes inline simplificados (evita dependências circulares)
import { StudentListView } from "./students/StudentListView";
import { GroupManagerView } from "./students/GroupManagerView";

interface StudentsTabProps {
  productId?: string;
}

export function StudentsTab({ productId }: StudentsTabProps) {
  const [activeView, setActiveView] = useState<"students" | "groups">("students");
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<BuyerWithGroups[]>([]);
  const [groups, setGroups] = useState<MemberGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchGroups = useCallback(async () => {
    if (!productId) return;
    
    const { data, error } = await supabase
      .from('product_member_groups')
      .select('*')
      .eq('product_id', productId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching groups:', error);
      return;
    }

    setGroups(data || []);
  }, [productId]);

  const fetchStudents = useCallback(async (searchQuery = '') => {
    if (!productId) return;
    setIsLoading(true);
    
    try {
      // Fetch buyers with access to this product
      let query = supabase
        .from('buyer_product_access')
        .select(`
          id,
          buyer_id,
          granted_at,
          access_type,
          buyer_profiles!inner(id, name, email)
        `, { count: 'exact' })
        .eq('product_id', productId)
        .eq('is_active', true)
        .range((page - 1) * limit, page * limit - 1);

      const { data: accessData, count, error } = await query;

      if (error) throw error;

      // Get group assignments for these buyers
      const buyerIds = accessData?.map(a => a.buyer_id) || [];
      
      let groupsData: any[] = [];
      if (buyerIds.length > 0) {
        const { data: bg } = await supabase
          .from('buyer_groups')
          .select('*')
          .in('buyer_id', buyerIds)
          .eq('is_active', true);
        groupsData = bg || [];
      }

      // Map to BuyerWithGroups format
      const studentsWithGroups: BuyerWithGroups[] = (accessData || []).map(access => {
        const profile = access.buyer_profiles as any;
        return {
          buyer_id: access.buyer_id,
          buyer_email: profile?.email || '',
          buyer_name: profile?.name || null,
          groups: groupsData.filter(g => g.buyer_id === access.buyer_id),
          access_type: access.access_type || undefined,
        };
      });

      setStudents(studentsWithGroups);
      setTotal(count || 0);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Erro ao carregar alunos');
    } finally {
      setIsLoading(false);
    }
  }, [productId, page, limit]);

  useEffect(() => {
    if (productId) {
      fetchGroups();
      fetchStudents();
    }
  }, [productId, fetchGroups, fetchStudents]);

  const handleSearch = (query: string) => {
    // TODO: Implement search with debounce
    fetchStudents(query);
  };

  const handleAssignGroups = async (buyerId: string, groupIds: string[]) => {
    try {
      // Remove all current groups
      await supabase
        .from('buyer_groups')
        .delete()
        .eq('buyer_id', buyerId);

      // Add new groups
      if (groupIds.length > 0) {
        const inserts = groupIds.map(groupId => ({
          buyer_id: buyerId,
          group_id: groupId,
          is_active: true,
        }));
        await supabase.from('buyer_groups').insert(inserts);
      }

      toast.success('Grupos atualizados');
      fetchStudents();
    } catch (error) {
      console.error('Error assigning groups:', error);
      toast.error('Erro ao atualizar grupos');
    }
  };

  const handleRevokeAccess = async (buyerId: string) => {
    if (!productId) return;
    
    try {
      await supabase
        .from('buyer_product_access')
        .update({ is_active: false })
        .eq('buyer_id', buyerId)
        .eq('product_id', productId);

      toast.success('Acesso revogado');
      fetchStudents();
    } catch (error) {
      console.error('Error revoking access:', error);
      toast.error('Erro ao revogar acesso');
    }
  };

  const handleCreateGroup = async (data: { name: string; description?: string; is_default?: boolean }) => {
    if (!productId) return;
    
    try {
      const { error } = await supabase.from('product_member_groups').insert({
        product_id: productId,
        name: data.name,
        description: data.description || null,
        is_default: data.is_default || false,
        position: groups.length,
      });

      if (error) throw error;
      toast.success('Grupo criado');
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Erro ao criar grupo');
    }
  };

  const handleUpdateGroup = async (groupId: string, data: { name?: string; description?: string; is_default?: boolean }) => {
    try {
      const { error } = await supabase
        .from('product_member_groups')
        .update(data)
        .eq('id', groupId);

      if (error) throw error;
      toast.success('Grupo atualizado');
      fetchGroups();
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Erro ao atualizar grupo');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('product_member_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      toast.success('Grupo excluído');
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Erro ao excluir grupo');
    }
  };

  const handleManagePermissions = (groupId: string) => {
    // TODO: Open permissions modal
    toast.info('Editor de permissões em desenvolvimento');
  };

  if (!productId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Produto não encontrado
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" />
              Lista de Alunos
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Grupos de Acesso
            </TabsTrigger>
          </TabsList>

          {activeView === "students" && (
            <Button size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Adicionar Aluno
            </Button>
          )}
        </div>

        <TabsContent value="students" className="mt-6">
          <StudentListView
            students={students}
            groups={groups}
            total={total}
            page={page}
            limit={limit}
            isLoading={isLoading}
            onSearch={handleSearch}
            onPageChange={setPage}
            onAssignGroups={handleAssignGroups}
            onRevokeAccess={handleRevokeAccess}
          />
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <GroupManagerView
            groups={groups}
            isLoading={isLoading}
            onCreateGroup={handleCreateGroup}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
            onManagePermissions={handleManagePermissions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
