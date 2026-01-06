/**
 * StudentFiltersPanel - Painel lateral de filtros estilo Kiwify
 */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import type { MemberGroup, StudentFilters } from '@/modules/members-area/types';

interface StudentFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  groups: MemberGroup[];
  filters: StudentFilters;
  onFiltersChange: (filters: StudentFilters) => void;
}

const ACCESS_TYPE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'producer', label: 'Produtor' },
  { value: 'invite', label: 'Convite' },
  { value: 'purchase', label: 'Compra' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendente' },
  { value: 'active', label: 'Ativo' },
];

export function StudentFiltersPanel({
  isOpen,
  onClose,
  groups,
  filters,
  onFiltersChange,
}: StudentFiltersPanelProps) {
  const handleClearFilters = () => {
    onFiltersChange({ groupId: null, accessType: null, status: null });
  };

  const handleGroupChange = (value: string) => {
    onFiltersChange({
      ...filters,
      groupId: value === 'all' ? null : value,
    });
  };

  const handleAccessTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      accessType: value === 'all' ? null : (value as 'producer' | 'invite' | 'purchase'),
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? null : (value as 'pending' | 'active'),
    });
  };

  const hasActiveFilters = filters.groupId !== null || filters.accessType !== null || filters.status !== null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-sm">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Filtros</SheetTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-primary hover:text-primary/80"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Grupo Filter */}
          <div className="space-y-2">
            <Label htmlFor="group-filter">Grupo</Label>
            <Select
              value={filters.groupId ?? 'all'}
              onValueChange={handleGroupChange}
            >
              <SelectTrigger id="group-filter">
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Acesso Filter */}
          <div className="space-y-2">
            <Label htmlFor="access-type-filter">Tipo de acesso</Label>
            <Select
              value={filters.accessType ?? 'all'}
              onValueChange={handleAccessTypeChange}
            >
              <SelectTrigger id="access-type-filter">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select
              value={filters.status ?? 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
