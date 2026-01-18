/**
 * FilterHeader - Header dos filtros com contador
 * 
 * Responsabilidade única: Renderizar header com ícone e contador de filtros ativos
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { SlidersHorizontal } from "lucide-react";

interface FilterHeaderProps {
  activeFiltersCount: number;
}

export function FilterHeader({ activeFiltersCount }: FilterHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-border/40">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Filtrar</h3>
      </div>
      {activeFiltersCount > 0 && (
        <span className="text-xs text-muted-foreground">
          {activeFiltersCount} ativo{activeFiltersCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
