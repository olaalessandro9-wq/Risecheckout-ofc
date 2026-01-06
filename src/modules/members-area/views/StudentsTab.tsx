/**
 * StudentsTab - Aba de gestão de alunos
 */

import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Filter, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MemberGroup, BuyerWithGroups, StudentStats, StudentFilters } from "@/modules/members-area/types";
import { StudentListView } from "./students/StudentListView";
import { StudentFiltersPanel } from "./students/StudentFiltersPanel";
import { AddStudentDialog } from "../components/dialogs/AddStudentDialog";

// Helper functions to avoid TypeScript type instantiation depth issues
async function fetchModuleIds(productId: string): Promise<string[]> {
  const result = await (supabase as any)
    .from('product_member_modules')
    .select('id')
    .eq('product_id', productId)
    .eq('is_published', true);
  return (result.data || []).map((m: { id: string }) => m.id);
}

async function fetchContentIds(moduleIds: string[]): Promise<string[]> {
  if (moduleIds.length === 0) return [];
  const result = await (supabase as any)
    .from('product_member_content')
    .select('id')
    .in('module_id', moduleIds)
    .eq('is_published', true);
  return (result.data || []).map((c: { id: string }) => c.id);
}

async function fetchProgressData(buyerIds: string[], contentIds: string[]): Promise<{ buyer_id: string; progress_percent: number; completed_at: string | null }[]> {
  if (buyerIds.length === 0 || contentIds.length === 0) return [];
  const result = await (supabase as any)
    .from('buyer_content_progress')
    .select('buyer_id, progress_percent, completed_at')
    .in('buyer_id', buyerIds)
    .in('content_id', contentIds);
  return result.data || [];
}

interface StudentsTabProps {
  productId?: string;
}

export function StudentsTab({ productId }: StudentsTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<BuyerWithGroups[]>([]);
  const [groups, setGroups] = useState<MemberGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<StudentStats>({
    totalStudents: 0,
    averageProgress: 0,
    completionRate: 0,
  });
  const [filters, setFilters] = useState<StudentFilters>({
    groupId: null,
    accessType: null,
    status: null,
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
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
      // 1. Fetch product to get producer (owner) ID
      const { data: productData } = await supabase
        .from('products')
        .select('user_id')
        .eq('id', productId)
        .single();

      const producerId = productData?.user_id;
      let producerStudent: BuyerWithGroups | null = null;

      // 2. Fetch producer data if exists
      if (producerId) {
        const { data: producerProfile } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('id', producerId)
          .single();

        // Get producer email via RPC
        const { data: producerEmail } = await supabase
          .rpc('get_user_email', { user_id: producerId });

        producerStudent = {
          buyer_id: producerId,
          buyer_email: producerEmail || '',
          buyer_name: producerProfile?.name || null,
          groups: [],
          access_type: 'producer',
          last_access_at: null,
          progress_percent: 0,
          status: 'active',
        };
      }

      // 3. Base query for buyers with access (students)
      let query = supabase
        .from('buyer_product_access')
        .select(`
          id,
          buyer_id,
          granted_at,
          access_type,
          buyer_profiles!inner(id, name, email, last_login_at, password_hash)
        `, { count: 'exact' })
        .eq('product_id', productId)
        .eq('is_active', true);

      // Apply access type filter (only for students, not producer)
      if (filters.accessType && filters.accessType !== 'producer') {
        query = query.eq('access_type', filters.accessType);
      }

      // Apply pagination
      query = query.range((page - 1) * limit, page * limit - 1);

      const { data: accessData, count, error } = await query;

      if (error) throw error;

      // Get group assignments for these buyers
      let buyerIds = accessData?.map(a => a.buyer_id) || [];
      
      let groupsData: any[] = [];
      if (buyerIds.length > 0) {
        const { data: bg } = await supabase
          .from('buyer_groups')
          .select('*')
          .in('buyer_id', buyerIds)
          .eq('is_active', true);
        groupsData = bg || [];
      }

      // Filter by group if set
      if (filters.groupId && buyerIds.length > 0) {
        const buyersInGroup = groupsData
          .filter(g => g.group_id === filters.groupId)
          .map(g => g.buyer_id);
        buyerIds = buyerIds.filter(id => buyersInGroup.includes(id));
      }

      // Get module IDs and content IDs using helper functions
      const moduleIds = await fetchModuleIds(productId);
      const productContentIds = await fetchContentIds(moduleIds);
      const totalContents = productContentIds.length;

      // Get progress for all buyers using helper function
      const progressData = await fetchProgressData(buyerIds, productContentIds);

      // Calculate progress per buyer
      const buyerProgressMap: Record<string, { totalProgress: number; completedCount: number; count: number }> = {};
      progressData.forEach(p => {
        if (!buyerProgressMap[p.buyer_id]) {
          buyerProgressMap[p.buyer_id] = { totalProgress: 0, completedCount: 0, count: 0 };
        }
        buyerProgressMap[p.buyer_id].totalProgress += (p.progress_percent || 0);
        buyerProgressMap[p.buyer_id].count += 1;
        if (p.completed_at) {
          buyerProgressMap[p.buyer_id].completedCount += 1;
        }
      });

      // Map to BuyerWithGroups format (students only)
      let studentsWithGroups: BuyerWithGroups[] = (accessData || []).map(access => {
        const profile = access.buyer_profiles as any;
        const buyerProgress = buyerProgressMap[access.buyer_id];
        
        // Calculate average progress for this buyer
        let progressPercent = 0;
        if (totalContents > 0 && buyerProgress) {
          progressPercent = Math.round(buyerProgress.totalProgress / totalContents);
        }

        // Determine status based on password_hash
        const isPending = !profile?.password_hash || profile.password_hash === 'PENDING_PASSWORD_SETUP';
        
        // Map access_type for display
        const accessType = access.access_type as BuyerWithGroups['access_type'];

        return {
          buyer_id: access.buyer_id,
          buyer_email: profile?.email || '',
          buyer_name: profile?.name || null,
          groups: groupsData.filter(g => g.buyer_id === access.buyer_id),
          access_type: accessType,
          last_access_at: profile?.last_login_at || null,
          progress_percent: progressPercent,
          status: isPending ? 'pending' : 'active',
          invited_at: access.granted_at || null,
        };
      });

      // Filter by group after mapping
      if (filters.groupId) {
        studentsWithGroups = studentsWithGroups.filter(s => 
          s.groups.some(g => g.group_id === filters.groupId)
        );
      }

      // Filter by status
      if (filters.status && filters.status !== 'all') {
        studentsWithGroups = studentsWithGroups.filter(s => s.status === filters.status);
      }

      // 4. Combine producer + students
      let allStudents: BuyerWithGroups[] = [];
      
      // Include producer only if no filter or filter matches 'producer'
      const shouldIncludeProducer = !filters.accessType || filters.accessType === 'producer';
      const shouldIncludeStudents = !filters.accessType || filters.accessType !== 'producer';

      if (producerStudent && shouldIncludeProducer && !filters.groupId) {
        allStudents.push(producerStudent);
      }
      
      if (shouldIncludeStudents) {
        allStudents = [...allStudents, ...studentsWithGroups];
      }

      // Calculate stats (including producer)
      const totalStudents = allStudents.length;
      let sumProgress = 0;
      let completedCount = 0;

      allStudents.forEach(s => {
        sumProgress += s.progress_percent || 0;
        if ((s.progress_percent || 0) >= 100) {
          completedCount += 1;
        }
      });

      const averageProgress = totalStudents > 0 ? sumProgress / totalStudents : 0;
      const completionRate = totalStudents > 0 ? (completedCount / totalStudents) * 100 : 0;

      setStats({
        totalStudents,
        averageProgress,
        completionRate,
      });

      setStudents(allStudents);
      setTotal(allStudents.length);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Erro ao carregar alunos');
    } finally {
      setIsLoading(false);
    }
  }, [productId, page, limit, filters]);

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

  const handleFiltersChange = (newFilters: StudentFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleExport = (format: 'csv' | 'xls') => {
    if (students.length === 0) {
      toast.error('Nenhum aluno para exportar');
      return;
    }

    const headers = ['Nome', 'Email', 'Último Acesso', 'Progresso (%)', 'Tipo de Acesso'];
    const rows = students.map(s => [
      s.buyer_name || 'Sem nome',
      s.buyer_email,
      s.last_access_at ? new Date(s.last_access_at).toLocaleDateString('pt-BR') : '—',
      String(s.progress_percent ?? 0),
      s.access_type === 'producer' ? 'Produtor' : 'Aluno',
    ]);

    const separator = format === 'csv' ? ',' : '\t';
    const content = [headers.join(separator), ...rows.map(r => r.join(separator))].join('\n');
    const mimeType = format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel';
    const extension = format === 'csv' ? 'csv' : 'xls';

    const blob = new Blob(['\ufeff' + content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alunos_${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exportado como ${extension.toUpperCase()}`);
  };

  const handleAssignGroups = async (buyerId: string, groupIds: string[]) => {
    try {
      await supabase
        .from('buyer_groups')
        .delete()
        .eq('buyer_id', buyerId);

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

  const hasActiveFilters = filters.groupId !== null || filters.accessType !== null || filters.status !== null;

  if (!productId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Produto não encontrado
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Lista de Alunos
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setIsFiltersOpen(true)}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-background text-foreground">
                {(filters.groupId ? 1 : 0) + (filters.accessType ? 1 : 0) + (filters.status ? 1 : 0)}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('xls')}>
                Exportar XLS
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" className="gap-2" onClick={() => setIsAddStudentOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Adicionar Aluno
          </Button>
        </div>
      </div>

      {/* Student List */}
      <StudentListView
        students={students}
        groups={groups}
        total={total}
        page={page}
        limit={limit}
        isLoading={isLoading}
        stats={stats}
        onSearch={handleSearch}
        onPageChange={setPage}
        onAssignGroups={handleAssignGroups}
        onRevokeAccess={handleRevokeAccess}
      />

      {/* Filters Panel */}
      <StudentFiltersPanel
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        groups={groups}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Add Student Dialog */}
      <AddStudentDialog
        open={isAddStudentOpen}
        onOpenChange={setIsAddStudentOpen}
        productId={productId}
        groups={groups}
        onSuccess={() => fetchStudents()}
      />
    </div>
  );
}
