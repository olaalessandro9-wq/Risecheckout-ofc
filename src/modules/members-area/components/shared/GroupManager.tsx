/**
 * GroupManager - Manage access groups for a product
 * Optimized: Removed heavy framer-motion layout animations
 */

import { useState } from 'react';
import {
  Users,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Shield,
  Star,
  GripVertical,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { MemberGroup } from '@/modules/members-area/types';

interface GroupManagerProps {
  groups: MemberGroup[];
  isLoading?: boolean;
  onCreateGroup: (data: { name: string; description?: string; is_default?: boolean }) => Promise<void>;
  onUpdateGroup: (groupId: string, data: { name?: string; description?: string; is_default?: boolean }) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  onEditGroup: (groupId: string) => void;
  onCreateGroupUnified: () => void;
}

export function GroupManager({
  groups,
  isLoading = false,
  onUpdateGroup,
  onDeleteGroup,
  onEditGroup,
  onCreateGroupUnified,
}: GroupManagerProps) {
  const [editingGroup, setEditingGroup] = useState<MemberGroup | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', is_default: false });
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = (group: MemberGroup) => {
    setFormData({
      name: group.name,
      description: group.description || '',
      is_default: group.is_default,
    });
    setEditingGroup(group);
  };


  const handleUpdate = async () => {
    if (!editingGroup || !formData.name.trim()) return;
    setIsSaving(true);
    await onUpdateGroup(editingGroup.id, formData);
    setIsSaving(false);
    setEditingGroup(null);
  };

  const handleDelete = async (groupId: string) => {
    if (confirm('Tem certeza que deseja excluir este grupo?')) {
      await onDeleteGroup(groupId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Grupos de Acesso
          </h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os grupos que controlam o acesso aos módulos
          </p>
        </div>
        <Button onClick={onCreateGroupUnified} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Novo Grupo
        </Button>
      </div>

      {/* Groups List - Optimized without heavy animations */}
      <div className="space-y-2">
        {groups.map((group) => (
          <div
            key={group.id}
            className={cn(
              'group flex items-center gap-4 p-4 rounded-lg border bg-card',
              'hover:border-primary/30 transition-colors',
              !group.is_active && 'opacity-60'
            )}
          >
            {/* Drag Handle */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Icon */}
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              group.is_default ? 'bg-primary/10' : 'bg-muted'
            )}>
              {group.is_default ? (
                <Star className="w-5 h-5 text-primary" />
              ) : (
                <Shield className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">{group.name}</h4>
                {group.is_default && (
                  <Badge variant="secondary" className="text-xs">
                    Padrão
                  </Badge>
                )}
              </div>
              {group.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {group.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onEditGroup(group.id)}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Editar
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenEdit(group)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  {group.is_default ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center px-2 py-1.5 text-sm text-muted-foreground cursor-not-allowed">
                            <Lock className="w-4 h-4 mr-2" />
                            Excluir
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>O grupo padrão não pode ser excluído</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => handleDelete(group.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {groups.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum grupo criado ainda</p>
            <Button variant="link" onClick={onCreateGroupUnified}>
              Criar primeiro grupo
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Grupo</DialogTitle>
            <DialogDescription>
              Atualize as informações do grupo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do grupo</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="edit-is_default">Grupo padrão</Label>
                <p className="text-xs text-muted-foreground">
                  Novos alunos serão adicionados automaticamente
                </p>
              </div>
              <Switch
                id="edit-is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGroup(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isSaving || !formData.name.trim()}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
