/**
 * StudentsTab - Aba de gestão de alunos
 * Uses Edge Function for listing (bypasses RLS on buyer_profiles)
 * 
 * @see RISE ARCHITECT PROTOCOL - Refactored to ~110 lines (compliance: 300-line limit)
 */

import { useState } from "react";
import { Users, UserPlus, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StudentFilters } from "@/modules/members-area/types";
import { StudentListView } from "./students/StudentListView";
import { StudentFiltersPanel } from "./students/StudentFiltersPanel";
import { AddStudentDialog } from "../components/dialogs/AddStudentDialog";
import { useStudentsData } from "../hooks/useStudentsData";
import { useStudentsActions } from "../hooks/useStudentsActions";

interface StudentsTabProps {
  productId?: string;
}

export function StudentsTab({ productId }: StudentsTabProps) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<StudentFilters>({
    groupId: null,
    accessType: null,
    status: null,
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const limit = 20;

  // Data fetching
  const {
    students,
    groups,
    total,
    stats,
    isLoading,
    fetchStudents,
  } = useStudentsData({ productId, page, limit, filters, searchQuery });

  // Actions
  const {
    handleAssignGroups,
    handleRevokeAccess,
    handleExport,
  } = useStudentsActions({ productId, students, onRefresh: () => fetchStudents() });

  const handleSearch = (query: string) => {
    fetchStudents(query);
  };

  const handleFiltersChange = (newFilters: StudentFilters) => {
    setFilters(newFilters);
    setPage(1);
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
