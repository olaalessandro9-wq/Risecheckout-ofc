/**
 * EnvironmentSelector - Seletor de ambiente Sandbox/Produção
 */

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AsaasEnvironment } from '../types';

interface EnvironmentSelectorProps {
  environment: AsaasEnvironment;
  onEnvironmentChange: (value: AsaasEnvironment) => void;
  isAdmin: boolean;
}

export function EnvironmentSelector({
  environment,
  onEnvironmentChange,
  isAdmin,
}: EnvironmentSelectorProps) {
  if (!isAdmin) return null;

  return (
    <div className="space-y-2">
      <Label htmlFor="environment">Ambiente</Label>
      <Select
        value={environment}
        onValueChange={(value: AsaasEnvironment) => onEnvironmentChange(value)}
      >
        <SelectTrigger id="environment">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sandbox">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              Sandbox (Testes)
            </div>
          </SelectItem>
          <SelectItem value="production">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Produção
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {environment === 'sandbox'
          ? 'Ambiente de testes. Nenhuma transação real será processada.'
          : 'Ambiente de produção. Transações reais serão processadas.'}
      </p>
    </div>
  );
}
