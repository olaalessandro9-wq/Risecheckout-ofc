/**
 * FilterActions - Botões de ação dos filtros
 * 
 * Responsabilidade única: Botões Limpar e Aplicar
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { Button } from "@/components/ui/button";

interface FilterActionsProps {
  onClearAll: () => void;
  onApply: () => void;
}

export function FilterActions({ onClearAll, onApply }: FilterActionsProps) {
  return (
    <div className="flex gap-2 pt-4 border-t border-border/40">
      <Button
        variant="ghost"
        onClick={onClearAll}
        className="flex-1 h-9 text-sm"
      >
        Limpar
      </Button>
      <Button
        onClick={onApply}
        className="flex-1 h-9 text-sm"
      >
        Aplicar
      </Button>
    </div>
  );
}
