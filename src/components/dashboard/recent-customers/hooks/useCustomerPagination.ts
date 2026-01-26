/**
 * Hook para lógica de paginação de clientes
 * 
 * @version RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * - Single Responsibility: Apenas lógica de paginação
 * - Performance: Menos itens por página em ultrawide via Context SSOT
 * - Reusabilidade: Pode ser usado em outras tabelas
 */

import { useState, useMemo } from "react";
import { useUltrawidePerformance } from "@/contexts/UltrawidePerformanceContext";
import type { Customer } from "../types";

const ITEMS_PER_PAGE_STANDARD = 10;
const ITEMS_PER_PAGE_ULTRAWIDE = 5;

interface UseCustomerPaginationResult {
  currentPage: number;
  totalPages: number;
  searchTerm: string;
  filteredCustomers: Customer[];
  paginatedCustomers: Customer[];
  pageNumbers: (number | string)[];
  handlePageChange: (page: number) => void;
  handlePrevious: () => void;
  handleNext: () => void;
  handleSearchChange: (value: string) => void;
}

export function useCustomerPagination(customers: Customer[]): UseCustomerPaginationResult {
  const { isUltrawide } = useUltrawidePerformance();
  const ITEMS_PER_PAGE = isUltrawide ? ITEMS_PER_PAGE_ULTRAWIDE : ITEMS_PER_PAGE_STANDARD;
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar clientes por termo de busca
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;

    const term = searchTerm.toLowerCase();
    return customers.filter(customer =>
      customer.id.toLowerCase().includes(term) ||
      customer.client.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term) ||
      customer.offer.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  // Calcular total de páginas
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

  // Obter clientes da página atual
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, currentPage]);

  // Calcular range de páginas a exibir
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (totalPages <= 8) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxPagesToShow; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - maxPagesToShow + 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return {
    currentPage,
    totalPages,
    searchTerm,
    filteredCustomers,
    paginatedCustomers,
    pageNumbers,
    handlePageChange,
    handlePrevious,
    handleNext,
    handleSearchChange,
  };
}
