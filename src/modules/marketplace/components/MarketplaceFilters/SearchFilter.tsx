/**
 * SearchFilter - Filtro de busca por texto
 * 
 * Responsabilidade única: Input de busca com clear button
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface SearchFilterProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
}

export function SearchFilter({
  searchInput,
  setSearchInput,
  onSearch,
  onClearSearch,
}: SearchFilterProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="search" className="text-xs font-medium">
        Nome do produtor ou do produto
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          id="search"
          placeholder="Insira..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          className="pl-9 h-9 text-sm"
        />
        {searchInput && (
          <button
            onClick={onClearSearch}
            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
