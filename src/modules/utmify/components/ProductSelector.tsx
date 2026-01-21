/**
 * ProductSelector - Multi-select for products
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Responsibility
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUTMifyContext } from "../context";

export function ProductSelector() {
  const { products, selectedProducts, toggleProduct } = useUTMifyContext();
  const [open, setOpen] = useState(false);

  const getLabel = () => {
    if (selectedProducts.length === 0) return "Selecione os produtos";
    if (selectedProducts.length === products.length) return "Todos os produtos";
    return `${selectedProducts.length} produto(s) selecionado(s)`;
  };

  return (
    <div className="space-y-2">
      <Label>Produtos</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            role="combobox" 
            className="w-full justify-between"
          >
            {getLabel()}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar produto..." />
            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {products.map((product) => (
                <CommandItem 
                  key={product.id} 
                  onSelect={() => toggleProduct(product.id)}
                >
                  <Checkbox 
                    checked={selectedProducts.includes(product.id)} 
                    className="mr-2" 
                  />
                  {product.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedProducts.map((productId) => {
            const product = products.find((p) => p.id === productId);
            return product ? (
              <Badge key={productId} variant="secondary">
                {product.name}
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
