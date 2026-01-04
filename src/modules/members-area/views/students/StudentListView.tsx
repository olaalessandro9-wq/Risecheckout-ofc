/**
 * StudentListView - Wrapper simplificado do StudentList
 */

import { useState } from 'react';
import {
  Users,
  Search,
  MoreVertical,
  Mail,
  Calendar,
  Shield,
  UserX,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { BuyerWithGroups, MemberGroup } from '@/modules/members-area/types';

interface StudentListViewProps {
  students: BuyerWithGroups[];
  groups: MemberGroup[];
  total: number;
  page: number;
  limit: number;
  isLoading?: boolean;
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
  onSearch,
  onPageChange,
  onAssignGroups,
  onRevokeAccess,
}: StudentListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleGroupChange = async (buyerId: string, groupId: string) => {
    const student = students.find(s => s.buyer_id === buyerId);
    if (!student) return;

    const currentGroupIds = student.groups.map(g => g.group_id);
    const isInGroup = currentGroupIds.includes(groupId);

    const newGroupIds = isInGroup
      ? currentGroupIds.filter(id => id !== groupId)
      : [...currentGroupIds, groupId];

    await onAssignGroups(buyerId, newGroupIds);
  };

  return (
    <div className="space-y-4">
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
          <div className="col-span-4">Aluno</div>
          <div className="col-span-3">Grupos</div>
          <div className="col-span-3">Acesso desde</div>
          <div className="col-span-2 text-right">Ações</div>
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
        {!isLoading && students.map((student, index) => (
          <div
            key={student.buyer_id}
            className={cn(
              'grid grid-cols-12 gap-4 px-4 py-3 items-center',
              'hover:bg-muted/30 transition-colors',
              index !== students.length - 1 && 'border-b'
            )}
          >
            {/* Student Info */}
            <div className="col-span-4 flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">
                  {getInitials(student.buyer_name, student.buyer_email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {student.buyer_name || 'Sem nome'}
                </p>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {student.buyer_email}
                </p>
              </div>
            </div>

            {/* Groups */}
            <div className="col-span-3">
              <div className="flex items-center gap-1 flex-wrap">
                {student.groups.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Nenhum grupo</span>
                ) : (
                  student.groups.slice(0, 2).map(g => {
                    const group = groups.find(gr => gr.id === g.group_id);
                    return (
                      <Badge key={g.group_id} variant="secondary" className="text-xs py-0">
                        {group?.name || 'Grupo'}
                      </Badge>
                    );
                  })
                )}
                {student.groups.length > 2 && (
                  <Badge variant="outline" className="text-xs py-0">
                    +{student.groups.length - 2}
                  </Badge>
                )}
              </div>
            </div>

            {/* Access Date */}
            <div className="col-span-3 text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {student.groups[0]?.granted_at
                ? new Date(student.groups[0].granted_at).toLocaleDateString('pt-BR')
                : '—'
              }
            </div>

            {/* Actions */}
            <div className="col-span-2 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onRevokeAccess(student.buyer_id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Revogar acesso
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
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
    </div>
  );
}
