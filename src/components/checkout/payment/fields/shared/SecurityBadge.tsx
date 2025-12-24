/**
 * SecurityBadge - Selo de Segurança
 * 
 * Componente compartilhado que exibe selo de pagamento seguro.
 */

import { memo } from 'react';
import { Lock } from 'lucide-react';

export const SecurityBadge = memo(() => {
  return (
    <div className="flex items-center justify-center gap-2 pt-2 text-gray-500">
      <Lock className="w-4 h-4" />
      <p className="text-xs">Pagamento 100% seguro</p>
    </div>
  );
});

SecurityBadge.displayName = 'SecurityBadge';
