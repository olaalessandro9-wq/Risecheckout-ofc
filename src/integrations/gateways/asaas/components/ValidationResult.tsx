/**
 * ValidationResult - Exibe resultado da validação das credenciais
 */

import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationResultProps {
  lastResult: {
    valid: boolean;
    message?: string;
  } | null;
  hasChanges: boolean;
}

export function ValidationResult({ lastResult, hasChanges }: ValidationResultProps) {
  if (!lastResult || !hasChanges) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm',
        lastResult.valid
          ? 'text-green-600 dark:text-green-400'
          : 'text-destructive'
      )}
    >
      {lastResult.valid ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          <span>Credenciais válidas</span>
        </>
      ) : (
        <>
          <XCircle className="h-4 w-4" />
          <span>{lastResult.message || 'Credenciais inválidas'}</span>
        </>
      )}
    </div>
  );
}
