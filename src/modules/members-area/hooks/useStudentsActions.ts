/**
 * StudentsTab - Students Actions Hook
 * 
 * Responsible for:
 * - Assign groups to students
 * - Revoke student access
 * - Export students
 * 
 * @see RISE ARCHITECT PROTOCOL - Extracted for 300-line compliance
 */

import { useCallback } from "react";
import { toast } from "sonner";
import type { BuyerWithGroups, StudentFilters } from "@/modules/members-area/types";
import { studentsService } from "../services/students.service";

interface UseStudentsActionsProps {
  productId?: string;
  students: BuyerWithGroups[];
  onRefresh: () => void;
}

interface UseStudentsActionsReturn {
  handleAssignGroups: (buyerId: string, groupIds: string[]) => Promise<void>;
  handleRevokeAccess: (buyerId: string) => Promise<void>;
  handleExport: (format: 'csv' | 'xls') => void;
}

/**
 * Actions hook for Students Tab
 */
export function useStudentsActions({
  productId,
  students,
  onRefresh,
}: UseStudentsActionsProps): UseStudentsActionsReturn {

  const handleAssignGroups = useCallback(async (buyerId: string, groupIds: string[]) => {
    if (!productId) return;
    
    try {
      const { error } = await studentsService.assignGroups({
        buyer_id: buyerId,
        group_ids: groupIds,
      });

      if (error) throw new Error(error);

      toast.success('Grupos atualizados');
      onRefresh();
    } catch (error) {
      console.error('Error assigning groups:', error);
      toast.error('Erro ao atualizar grupos');
    }
  }, [productId, onRefresh]);

  const handleRevokeAccess = useCallback(async (buyerId: string) => {
    if (!productId) return;
    
    try {
      const { error } = await studentsService.revokeAccess(buyerId, productId);

      if (error) throw new Error(error);

      toast.success('Acesso revogado');
      onRefresh();
    } catch (error) {
      console.error('Error revoking access:', error);
      toast.error('Erro ao revogar acesso');
    }
  }, [productId, onRefresh]);

  const handleExport = useCallback((format: 'csv' | 'xls') => {
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
  }, [students]);

  return {
    handleAssignGroups,
    handleRevokeAccess,
    handleExport,
  };
}
