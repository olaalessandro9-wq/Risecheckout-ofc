/**
 * StudentListView - Lista de alunos estilo Kiwify
 */

import { useState } from 'react';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { BuyerWithGroups, MemberGroup, StudentStats } from '@/modules/members-area/types';
import { StudentStatsCards } from './StudentStatsCards';
import { StudentDetailPanel } from './StudentDetailPanel';

interface StudentListViewProps {
  students: BuyerWithGroups[];
  groups: MemberGroup[];
  total: number;
  page: number;
  limit: number;
  isLoading?: boolean;
  stats: StudentStats;
  onSearch: (query: string) => void;
  onPageChange: (page: number) => void;
  onAssignGroups: (buyerId: string, groupIds: string[]) => Promise<void>;
  onRevokeAccess: (buyerId: string) => Promise<void>;
}

export function StudentListView({
  students,
  groups,
  total,
  page,
  limit,
  isLoading = false,
  stats,
  onSearch,
  onPageChange,
  onAssignGroups,
  onRevokeAccess,
}: StudentListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<BuyerWithGroups | null>(null);
  const totalPages = Math.ceil(total / limit);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const formatLastAccess = (date: string | null | undefined) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStudentClick = (student: BuyerWithGroups) => {
    setSelectedStudent(student);
  };

  const handleClosePanel = () => {
    setSelectedStudent(null);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StudentStatsCards stats={stats} isLoading={isLoading} />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Buscar por nome ou email..."
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {total} {total === 1 ? 'aluno' : 'alunos'}
        </div>
      </div>

      {/* Student List */}
      <div className="border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
          <div className="col-span-5">Nome</div>
          <div className="col-span-4">Último Acesso</div>
          <div className="col-span-3">Progresso</div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && students.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum aluno encontrado</p>
          </div>
        )}

        {/* Students */}
        {!isLoading && students.map((student, index) => {
          const isProducer = student.access_type === 'producer';
          const progress = student.progress_percent ?? 0;
          
          return (
            <div
              key={student.buyer_id}
              onClick={() => handleStudentClick(student)}
              className={cn(
                'grid grid-cols-12 gap-4 px-4 py-3 items-center cursor-pointer',
                'hover:bg-muted/30 transition-colors',
                index !== students.length - 1 && 'border-b'
              )}
            >
              {/* Student Info - NOME */}
              <div className="col-span-5 flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">
                    {getInitials(student.buyer_name, student.buyer_email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate uppercase">
                      {student.buyer_name || 'Sem nome'}
                    </p>
                    {isProducer && (
                      <Badge className="text-xs py-0 px-1.5 bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20">
                        Você
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {student.buyer_email}
                  </p>
                </div>
              </div>

              {/* Last Access */}
              <div className="col-span-4 text-sm text-muted-foreground">
                {formatLastAccess(student.last_access_at)}
              </div>

              {/* Progress */}
              <div className="col-span-3 flex items-center gap-3">
                <Progress value={progress} className="h-2 flex-1" />
                <span className="text-sm font-medium w-10 text-right">{progress}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      <StudentDetailPanel
        student={selectedStudent}
        groups={groups}
        isOpen={!!selectedStudent}
        onClose={handleClosePanel}
        onAssignGroups={onAssignGroups}
        onRevokeAccess={onRevokeAccess}
      />
    </div>
  );
}
