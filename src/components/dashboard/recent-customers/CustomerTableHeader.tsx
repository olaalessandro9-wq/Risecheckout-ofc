/**
 * Header da tabela de clientes com busca e ações
 * 
 * RISE ARCHITECT PROTOCOL:
 * - Single Responsibility: Apenas header + controles
 * - Limite de 150 linhas: ✓
 */

import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Download, User } from "lucide-react";

interface CustomerTableHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  isLoading: boolean;
  isRefreshing: boolean;
  hasData: boolean;
}

export function CustomerTableHeader({
  searchTerm,
  onSearchChange,
  onRefresh,
  onExport,
  isLoading,
  isRefreshing,
  hasData,
}: CustomerTableHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <User className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Últimos Clientes</h3>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:flex-none">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/50 transition-all"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-background/50 border-border/50 hover:bg-muted/50 hover:text-primary hover:border-primary/20 transition-all"
          onClick={onRefresh}
          disabled={isLoading || isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-background/50 border-border/50 hover:bg-muted/50 hover:text-primary hover:border-primary/20 transition-all"
          onClick={onExport}
          disabled={!hasData}
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </div>
    </div>
  );
}
