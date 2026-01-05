/**
 * StudentDetailPanel - Painel lateral de detalhes do aluno (estilo Cakto)
 */

import { X, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { BuyerWithGroups, MemberGroup } from '@/modules/members-area/types';

interface StudentDetailPanelProps {
  student: BuyerWithGroups | null;
  groups: MemberGroup[];
  isOpen: boolean;
  onClose: () => void;
  onAssignGroups: (buyerId: string, groupIds: string[]) => Promise<void>;
  onRevokeAccess: (buyerId: string) => Promise<void>;
}

export function StudentDetailPanel({
  student,
  groups,
  isOpen,
  onClose,
  onAssignGroups,
  onRevokeAccess,
}: StudentDetailPanelProps) {
  if (!student) return null;

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isProducer = student.access_type === 'producer';
  const accessTypeLabel = isProducer ? 'Produtor' : 'Aluno';
  const currentGroupIds = student.groups.map(g => g.group_id);

  // Get group names for display
  const studentGroupNames = groups
    .filter(g => currentGroupIds.includes(g.id))
    .map(g => g.name);

  const handleGroupToggle = async (groupId: string) => {
    const isInGroup = currentGroupIds.includes(groupId);
    const newGroupIds = isInGroup
      ? currentGroupIds.filter(id => id !== groupId)
      : [...currentGroupIds, groupId];
    await onAssignGroups(student.buyer_id, newGroupIds);
  };

  const handleRevoke = async () => {
    await onRevokeAccess(student.buyer_id);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-lg font-semibold">Ver aluno</SheetTitle>
        </SheetHeader>

        {/* Tab indicator */}
        <div className="px-6 border-b">
          <div className="inline-block py-3 border-b-2 border-primary">
            <span className="text-sm font-medium text-primary">Detalhes</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-5">
          {/* Nome */}
          <div className="flex items-start justify-between">
            <span className="text-sm text-muted-foreground">Nome</span>
            <span className="text-sm font-medium text-right max-w-[60%]">
              {student.buyer_name || 'Sem nome'}
            </span>
          </div>

          {/* Email */}
          <div className="flex items-start justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium text-right max-w-[60%] break-all">
              {student.buyer_email}
            </span>
          </div>

          {/* Turmas */}
          <div className="flex items-start justify-between">
            <span className="text-sm text-muted-foreground">Turmas</span>
            <span className="text-sm font-medium text-right max-w-[60%]">
              {studentGroupNames.length > 0 ? studentGroupNames.join(', ') : '—'}
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge 
              variant={student.status === 'inactive' ? 'destructive' : 'default'}
              className={student.status === 'inactive' ? '' : 'bg-emerald-500 text-white hover:bg-emerald-600'}
            >
              {student.status === 'inactive' ? 'Inativo' : 'Ativo'}
            </Badge>
          </div>

          {/* Último acesso */}
          <div className="flex items-start justify-between">
            <span className="text-sm text-muted-foreground">Último acesso</span>
            <span className="text-sm font-medium">
              {formatDate(student.last_access_at)}
            </span>
          </div>

          {/* Progresso */}
          <div className="flex items-start justify-between">
            <span className="text-sm text-muted-foreground">Progresso</span>
            <span className="text-sm font-medium">
              {student.progress_percent ?? 0}%
            </span>
          </div>

          {/* Tipo de acesso */}
          <div className="flex items-start justify-between">
            <span className="text-sm text-muted-foreground">Tipo de acesso</span>
            <span className="text-sm font-medium">{accessTypeLabel}</span>
          </div>

          {/* Separator before groups management */}
          {groups.length > 0 && (
            <>
              <Separator className="my-4" />

              {/* Groups Management */}
              <div className="space-y-3">
                <span className="text-sm font-medium">Gerenciar Turmas</span>
                <div className="flex flex-wrap gap-2">
                  {groups.map((group) => {
                    const isInGroup = currentGroupIds.includes(group.id);
                    return (
                      <Badge
                        key={group.id}
                        variant={isInGroup ? 'default' : 'outline'}
                        className="cursor-pointer transition-colors"
                        onClick={() => handleGroupToggle(group.id)}
                      >
                        {group.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Revoke Access Button */}
          {!isProducer && (
            <>
              <Separator className="my-4" />
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleRevoke}
              >
                <UserX className="w-4 h-4 mr-2" />
                Revogar Acesso
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}