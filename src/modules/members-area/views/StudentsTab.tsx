/**
 * StudentsTab - Aba de gestão de alunos
 * Uses Edge Function for listing (bypasses RLS on buyer_profiles)
 */

import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Filter, Download } from "lucide-react";
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
import { studentsService } from "../services/students.service";

interface StudentsTabProps {
  productId?: string;
}

export function StudentsTab({ productId }: StudentsTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<BuyerWithGroups[]>([]);
  const [groups, setGroups] = useState<MemberGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
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

  const fetchStudents = useCallback(async (search = searchQuery) => {
    if (!productId) return;
    setIsLoading(true);
    
    try {
      // Get producer info for local display
      const { data: productData } = await supabase
        .from('products')
        .select('user_id')
        .eq('id', productId)
        .single();

      const producerId = productData?.user_id;
      let producerStudent: BuyerWithGroups | null = null;

      if (producerId) {
        const { data: producerProfile } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('id', producerId)
          .single();

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

      // Fetch students via Edge Function (bypasses RLS)
      const { data, error } = await studentsService.list(productId, {
        page,
        limit,
        search: search || undefined,
        access_type: filters.accessType && filters.accessType !== 'producer' ? filters.accessType : undefined,
        status: filters.status || undefined,
        group_id: filters.groupId || undefined,
      });

      if (error) {
        console.error('Error fetching students from service:', error);
        toast.error('Erro ao carregar alunos');
        setIsLoading(false);
        return;
      }

      const studentsList = data?.students || [];
      const backendTotal = data?.total || 0;
      const backendStats = (data as any)?.stats;

      // Combine producer + students
      let allStudents: BuyerWithGroups[] = [];
      
      const shouldIncludeProducer = !filters.accessType || filters.accessType === 'producer';
      const shouldIncludeStudents = !filters.accessType || filters.accessType !== 'producer';

      // Only show producer on first page, without group filter, and matching search
      const producerMatchesSearch = !search || 
        producerStudent?.buyer_email.toLowerCase().includes(search.toLowerCase()) ||
        producerStudent?.buyer_name?.toLowerCase().includes(search.toLowerCase());

      if (producerStudent && shouldIncludeProducer && !filters.groupId && page === 1 && producerMatchesSearch) {
        allStudents.push(producerStudent);
      }
      
      if (shouldIncludeStudents) {
        allStudents = [...allStudents, ...studentsList];
      }

      // Use backend stats if available, otherwise calculate
      if (backendStats) {
        // Add 1 for producer if we're showing them
        const totalWithProducer = shouldIncludeProducer && !filters.groupId ? backendStats.totalStudents + 1 : backendStats.totalStudents;
        setStats({
          totalStudents: totalWithProducer,
          averageProgress: backendStats.averageProgress || 0,
          completionRate: backendStats.completionRate || 0,
        });
      } else {
        setStats({
          totalStudents: allStudents.length,
          averageProgress: 0,
          completionRate: 0,
        });
      }

      setStudents(allStudents);
      // Total includes producer when applicable
      const displayTotal = shouldIncludeProducer && !filters.groupId && producerMatchesSearch ? backendTotal + 1 : backendTotal;
      setTotal(displayTotal);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Erro ao carregar alunos');
    } finally {
      setIsLoading(false);
    }
  }, [productId, page, limit, filters, searchQuery]);

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
