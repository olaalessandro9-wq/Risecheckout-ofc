/**
 * ProductsHeader - Header with add product button
 */

import { Button } from "@/components/ui/button";

interface ProductsHeaderProps {
  onAddClick: () => void;
}

export function ProductsHeader({ onAddClick }: ProductsHeaderProps) {
  return (
    <div className="flex justify-end">
      <Button 
        className="bg-success hover:bg-success/90 text-primary-foreground"
        onClick={onAddClick}
      >
        Adicionar Produto
      </Button>
    </div>
  );
}
