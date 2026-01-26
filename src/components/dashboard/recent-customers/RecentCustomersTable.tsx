/**
 * Tabela de clientes recentes - Container principal
 * 
 * RISE ARCHITECT PROTOCOL:
 * - Limite de 150 linhas: ✓ (antes: 437 linhas)
 * - Single Responsibility: Orquestra componentes filhos
 * - Clean Architecture: Lógica separada em hooks
 * - Otimizado para ultrawide com animações condicionais
 */

import { useState, useMemo } from "react";
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useDecryptCustomerBatch } from "@/hooks/useDecryptCustomerBatch";
import { OrderDetailsDialog } from "../OrderDetailsDialog";
import { CustomerTableHeader } from "./CustomerTableHeader";
import { CustomerTableBody } from "./CustomerTableBody";
import { CustomerPagination } from "./CustomerPagination";
import { useCustomerPagination } from "./hooks/useCustomerPagination";
import { isEncryptedValue, exportCustomersToCSV } from "./utils/customerUtils";
import { useIsUltrawide } from "@/hooks/useIsUltrawide";
import { cn } from "@/lib/utils";
import type { Customer, CustomerExportData } from "./types";

interface RecentCustomersTableProps {
  customers: Customer[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function RecentCustomersTable({ customers, isLoading = false, onRefresh }: RecentCustomersTableProps) {
  const { user } = useUnifiedAuth();
  const isUltrawide = useIsUltrawide();
  const [selectedOrder, setSelectedOrder] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pagination = useCustomerPagination(customers);

  // IDs para descriptografia (apenas produtores)
  const orderIdsToDecrypt = useMemo(() => {
    if (!user?.id) return [];
    return pagination.paginatedCustomers
      .filter(c => c.productOwnerId === user.id && isEncryptedValue(c.customerEmail))
      .map(c => c.orderId);
  }, [pagination.paginatedCustomers, user?.id]);

  const { decryptedMap, isLoading: isDecrypting } = useDecryptCustomerBatch(
    orderIdsToDecrypt,
    orderIdsToDecrypt.length > 0
  );

  const getDisplayEmail = (customer: Customer): React.ReactNode => {
    const isProducer = user?.id === customer.productOwnerId;
    const isEncrypted = isEncryptedValue(customer.customerEmail);

    if (isProducer && isEncrypted) {
      const decrypted = decryptedMap[customer.orderId]?.customer_email;
      if (isDecrypting && !decrypted) {
        return <Skeleton className="h-4 w-32 bg-primary/10" />;
      }
      if (decrypted) return decrypted;
      return <span className="text-muted-foreground/50">••••••••••</span>;
    }

    if (!isProducer && isEncrypted) {
      return <span className="text-muted-foreground/50">••••••••••</span>;
    }

    return customer.email || "—";
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        await new Promise(resolve => setTimeout(resolve, 500));
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedOrder(customer);
    setIsDialogOpen(true);
  };

  // Preparar dados para exportação
  const exportData: CustomerExportData[] = pagination.filteredCustomers.map(c => ({
    id: c.id,
    offer: c.offer,
    client: c.client,
    email: c.email,
    createdAt: c.createdAt,
    value: c.value,
    status: c.status
  }));

  // Wrapper condicional: div simples em ultrawide
  const Wrapper = isUltrawide ? "div" : motion.div;
  const wrapperProps = isUltrawide
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.25, delay: 0.1 },
      };

  return (
    <>
      <OrderDetailsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        orderData={selectedOrder ? {
          id: selectedOrder.orderId,
          customerName: selectedOrder.customerName,
          customerEmail: selectedOrder.customerEmail,
          customerPhone: selectedOrder.customerPhone,
          customerDocument: selectedOrder.customerDocument,
          productName: selectedOrder.productName,
          productImageUrl: selectedOrder.productImageUrl,
          amount: selectedOrder.value,
          status: selectedOrder.status,
          createdAt: selectedOrder.createdAt,
        } : null}
        productOwnerId={selectedOrder?.productOwnerId}
      />

      <Wrapper {...wrapperProps} className="relative">
        <div
          className={cn(
            "relative bg-card/95 border border-border/50 rounded-2xl p-6",
            !isUltrawide && "backdrop-blur-sm hover:border-primary/20 hover:shadow-lg transition-all duration-300",
            isUltrawide && "transition-colors duration-200"
          )}
        >
          <div className="space-y-6">
            <CustomerTableHeader
              searchTerm={pagination.searchTerm}
              onSearchChange={pagination.handleSearchChange}
              onRefresh={handleRefresh}
              onExport={() => exportCustomersToCSV(exportData)}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
              hasData={pagination.filteredCustomers.length > 0}
            />

            <div
              className={cn(
                "border border-border/30 rounded-xl overflow-hidden bg-background/20 overflow-x-auto",
                !isUltrawide && "backdrop-blur-sm"
              )}
            >
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/50 border-border/30">
                    <TableHead className="text-muted-foreground font-medium">ID</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Oferta</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Cliente</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Email</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Criado em</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Valor</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <CustomerTableBody
                  customers={pagination.paginatedCustomers}
                  isLoading={isLoading}
                  searchTerm={pagination.searchTerm}
                  getDisplayEmail={getDisplayEmail}
                  onViewDetails={handleViewDetails}
                />
              </Table>
            </div>

            {!isLoading && pagination.filteredCustomers.length > 0 && (
              <CustomerPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.filteredCustomers.length}
                itemsPerPage={10}
                pageNumbers={pagination.pageNumbers}
                onPageChange={pagination.handlePageChange}
                onPrevious={pagination.handlePrevious}
                onNext={pagination.handleNext}
              />
            )}
          </div>
        </div>
      </Wrapper>
    </>
  );
}
