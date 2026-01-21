/**
 * Webhooks Header - Search, Filter, Add Button
 * 
 * @module modules/webhooks/components
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useWebhooks } from "../context/WebhooksContext";

export function WebhooksHeader() {
  const { 
    products, 
    searchTerm, 
    selectedProductFilter, 
    setSearchTerm, 
    setProductFilter, 
    openForm 
  } = useWebhooks();

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Product Filter */}
        <Select value={selectedProductFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por produto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os produtos</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Add Button */}
      <Button onClick={() => openForm()}>
        <Plus className="h-4 w-4 mr-2" />
        Adicionar
      </Button>
    </div>
  );
}
