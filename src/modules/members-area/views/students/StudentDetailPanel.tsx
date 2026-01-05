/**
 * StudentDetailPanel - Painel lateral de detalhes do aluno
 */

import { X, Mail, Calendar, Shield, UserX, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BuyerWithGroups, MemberGroup } from '@/modules/members-area/types';

interface StudentDetailPanelProps {
  student: BuyerWithGroups | null;
  groups: MemberGroup[];
  isOpen: boolean;
  onClose: () => void;
  onAssignGroups: (buyerId: string, groupIds: string[]) => Promise<void>;
  onRevokeAccess: (buyerId: string) => Promise<void>;
}

const ACCESS_TYPE_LABELS: Record<string, string> = {
  producer: 'Produtor',
  student: 'Aluno',
};

export function StudentDetailPanel({
  student,
  groups,
  isOpen,
  onClose,
  onAssignGroups,
  onRevokeAccess,
}: StudentDetailPanelProps) {
  if (!student) return null;

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

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
  const accessTypeLabel = ACCESS_TYPE_LABELS[student.access_type || 'student'] || 'Aluno';
  const currentGroupIds = student.groups.map(g => g.group_id);

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
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg">
                {getInitials(student.buyer_name, student.buyer_email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg font-semibold uppercase truncate">
                  {student.buyer_name || 'Sem nome'}
                </SheetTitle>
                {isProducer && (
                  <Badge className="bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20">
                    Você
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="w-3 h-3" />
                {student.buyer_email}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge 
              variant={student.status === 'inactive' ? 'destructive' : 'default'}
              className={student.status === 'inactive' ? '' : 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20'}
            >
              {student.status === 'inactive' ? 'Inativo' : 'Ativo'}
            </Badge>
          </div>

          {/* Access Type */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tipo de acesso</span>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{accessTypeLabel}</span>
            </div>
          </div>

          {/* Last Access */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Último acesso</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{formatDate(student.last_access_at)}</span>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progresso</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{student.progress_percent ?? 0}%</span>
              </div>
            </div>
            <Progress value={student.progress_percent ?? 0} className="h-2" />
          </div>

          <Separator />

          {/* Groups */}
          <div className="space-y-3">
            <span className="text-sm font-medium">Turmas / Grupos</span>
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
              {groups.length === 0 && (
                <span className="text-sm text-muted-foreground">Nenhum grupo disponível</span>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          {!isProducer && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleRevoke}
            >
              <UserX className="w-4 h-4 mr-2" />
              Revogar Acesso
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
