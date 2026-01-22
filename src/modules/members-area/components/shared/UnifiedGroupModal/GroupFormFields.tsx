/**
 * GroupFormFields - Basic form fields for group name, description, and default status
 */

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { GroupFormFieldsProps } from './types';

export function GroupFormFields({
  name,
  setName,
  description,
  setDescription,
  isDefault,
  setIsDefault,
  nameError,
  clearNameError,
}: GroupFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="group-name">Nome do grupo *</Label>
        <Input
          id="group-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) clearNameError();
          }}
          placeholder="Ex: VIP, Premium, Básico..."
          className={nameError ? 'border-destructive' : ''}
        />
        {nameError && (
          <p className="text-sm text-destructive">{nameError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="group-description">Descrição (opcional)</Label>
        <Textarea
          id="group-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o propósito deste grupo..."
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between py-2">
        <div>
          <Label htmlFor="is-default">Grupo padrão</Label>
          <p className="text-xs text-muted-foreground">
            Novos alunos serão adicionados automaticamente
          </p>
        </div>
        <Switch
          id="is-default"
          checked={isDefault}
          onCheckedChange={setIsDefault}
        />
      </div>
    </div>
  );
}
