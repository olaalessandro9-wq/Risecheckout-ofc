/**
 * useAdminPagination - Hook reutilizável para paginação
 * 
 * RISE Protocol V3 - Eliminação de duplicação de lógica
 * Baseado no padrão de useCustomerPagination
 * 
 * @version 1.0.0
 */

import { useState, useMemo, useCallback } from "react";

const DEFAULT_ITEMS_PER_PAGE = 15;

export interface PaginationResult<T> {
  /** Página atual (1-indexed) */
  currentPage: number;
  /** Total de páginas */
  totalPages: number;
  /** Itens paginados para a página atual */
  paginatedItems: T[];
  /** Array de números de página para renderizar (inclui 'ellipsis') */
  pageNumbers: (number | string)[];
  /** Total de itens filtrados */
  totalItems: number;
  /** Índice do primeiro item na página atual */
  startIndex: number;
  /** Índice do último item na página atual */
  endIndex: number;
  /** Navegar para página específica */
  goToPage: (page: number) => void;
  /** Ir para página anterior */
  goToPrevious: () => void;
  /** Ir para próxima página */
  goToNext: () => void;
  /** Resetar para primeira página */
  reset: () => void;
}

export function useAdminPagination<T>(
  items: T[],
  itemsPerPage: number = DEFAULT_ITEMS_PER_PAGE
): PaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Reset page if items change and current page is out of bounds
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage) {
    setCurrentPage(safePage);
  }

  const paginatedItems = useMemo(() => {
    const startIdx = (safePage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    return items.slice(startIdx, endIdx);
  }, [items, safePage, itemsPerPage]);

  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow + 2) {
      // Se poucos pages, mostrar todos
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (safePage <= 3) {
      // Início: mostrar primeiras páginas + ellipsis + última
      for (let i = 1; i <= maxPagesToShow; i++) {
        pages.push(i);
      }
      pages.push("ellipsis");
      pages.push(totalPages);
    } else if (safePage >= totalPages - 2) {
      // Fim: mostrar primeira + ellipsis + últimas páginas
      pages.push(1);
      pages.push("ellipsis");
      for (let i = totalPages - maxPagesToShow + 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Meio: primeira + ellipsis + páginas ao redor + ellipsis + última
      pages.push(1);
      pages.push("ellipsis");
      for (let i = safePage - 1; i <= safePage + 1; i++) {
        pages.push(i);
      }
      pages.push("ellipsis");
      pages.push(totalPages);
    }

    return pages;
  }, [safePage, totalPages]);

  const startIndex = (safePage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(safePage * itemsPerPage, items.length);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const goToPrevious = useCallback(() => {
    if (safePage > 1) {
      setCurrentPage(safePage - 1);
    }
  }, [safePage]);

  const goToNext = useCallback(() => {
    if (safePage < totalPages) {
      setCurrentPage(safePage + 1);
    }
  }, [safePage, totalPages]);

  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage: safePage,
    totalPages,
    paginatedItems,
    pageNumbers,
    totalItems: items.length,
    startIndex,
    endIndex,
    goToPage,
    goToPrevious,
    goToNext,
    reset,
  };
}
