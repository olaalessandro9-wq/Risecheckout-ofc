/**
 * UpdateTokenSection - Seção colapsável para atualizar token existente
 */

import { ChevronDown, Info } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { TokenInput } from './TokenInput';

interface UpdateTokenSectionProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  apiToken: string;
  onTokenChange: (value: string) => void;
  showToken: boolean;
  onToggleShowToken: () => void;
}

export function UpdateTokenSection({
  isOpen,
  onOpenChange,
  apiToken,
  onTokenChange,
  showToken,
  onToggleShowToken,
}: UpdateTokenSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange} className="space-y-4">
      <CollapsibleTrigger className="flex items-center gap-3 text-sm font-semibold hover:opacity-80 transition-opacity w-full p-4 rounded-xl bg-accent/50 border border-border">
        <ChevronDown 
          className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          style={{ color: 'var(--text)' }} 
        />
        <span style={{ color: 'var(--text)' }}>Atualizar Token</span>
        <span className="text-xs opacity-60 ml-auto" style={{ color: 'var(--subtext)' }}>
          (clique para expandir)
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-2">
        <TokenInput
          apiToken={apiToken}
          onTokenChange={onTokenChange}
          showToken={showToken}
          onToggleShowToken={onToggleShowToken}
          placeholder="••••••••••••••••"
        />
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--subtext)' }}>
            Token já está configurado e funcionando. Deixe em branco para manter o atual ou informe um novo para atualizar.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
