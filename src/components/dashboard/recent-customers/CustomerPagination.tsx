/**
 * Controles de paginação da tabela de clientes
 * 
 * RISE ARCHITECT PROTOCOL:
 * - Single Responsibility: Apenas controles de paginação
 * - Limite de 150 linhas: ✓
 */

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CustomerPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  pageNumbers: (number | string)[];
  onPageChange: (page: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}

const ITEMS_PER_PAGE = 10;

export function CustomerPagination({
  currentPage,
  totalPages,
  totalItems,
  pageNumbers,
  onPageChange,
  onPrevious,
  onNext,
}: CustomerPaginationProps) {
  const startItem = ((currentPage - 1) * ITEMS_PER_PAGE) + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground pt-2">
      <span>
        Mostrando {startItem} a {endItem} de {totalItems} registros
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          disabled={currentPage === 1}
          onClick={onPrevious}
          className="h-8 w-8 hover:bg-muted/50 hover:text-primary"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return <span key={`ellipsis-${index}`} className="px-2">...</span>;
            }

            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="icon"
                onClick={() => onPageChange(page as number)}
                className={`h-8 w-8 ${
                  currentPage === page
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "hover:bg-muted/50 hover:text-primary"
                }`}
              >
                {page}
              </Button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          disabled={currentPage === totalPages}
          onClick={onNext}
          className="h-8 w-8 hover:bg-muted/50 hover:text-primary"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
