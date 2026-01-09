import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Download, Eye, ChevronLeft, ChevronRight, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useDecryptCustomerBatch } from "@/hooks/useDecryptCustomerBatch";

interface Customer {
  id: string;
  orderId: string;
  offer: string;
  client: string;
  phone: string;
  email: string;
  createdAt: string;
  value: string;
  status: "Pago" | "Pendente" | "Reembolso" | "Chargeback";
  productName: string;
  productImageUrl: string;
  productOwnerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDocument: string;
  fullCreatedAt: string;
}

interface RecentCustomersTableProps {
  customers: Customer[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ITEMS_PER_PAGE = 10;

/**
 * Verifica se um valor parece estar criptografado (base64 longo)
 */
function isEncryptedValue(value: string | null | undefined): boolean {
  if (!value || value.trim() === "") return false;
  // Valores criptografados são base64 com pelo menos 24 caracteres (IV + ciphertext)
  return value.length > 24 && /^[A-Za-z0-9+/=]+$/.test(value);
}

/**
 * Formata telefone para exibição
 */
function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  // Remove caracteres não numéricos
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function RecentCustomersTable({ customers, isLoading = false, onRefresh }: RecentCustomersTableProps) {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // IDs dos pedidos da página atual que o usuário é produtor e precisa descriptografar
  const orderIdsToDecrypt = useMemo(() => {
    if (!user?.id) return [];
    return paginatedCustomers
      .filter(c => c.productOwnerId === user.id && isEncryptedValue(c.customerPhone))
      .map(c => c.orderId);
  }, [paginatedCustomers, user?.id]);

  // Hook para descriptografar telefones em lote (apenas para produtores)
  const { decryptedMap, isLoading: isDecrypting } = useDecryptCustomerBatch(
    orderIdsToDecrypt,
    orderIdsToDecrypt.length > 0
  );

  /**
   * Retorna o telefone para exibição na tabela
   * - Se produtor e descriptografado: mostra telefone formatado
   * - Se produtor e carregando: mostra skeleton
   * - Se não produtor ou criptografado: mostra mascarado
   */
  const getDisplayPhone = (customer: Customer): React.ReactNode => {
    const isProducer = user?.id === customer.productOwnerId;
    const isEncrypted = isEncryptedValue(customer.customerPhone);

    // Se é produtor e o valor está criptografado
    if (isProducer && isEncrypted) {
      const decrypted = decryptedMap[customer.orderId]?.customer_phone;
      
      if (isDecrypting && !decrypted) {
        return <Skeleton className="h-4 w-28 bg-primary/10" />;
      }
      
      if (decrypted) {
        return formatPhone(decrypted);
      }
      
      // Fallback: ainda carregando ou erro
      return <span className="text-muted-foreground/50">••••••••••</span>;
    }

    // Se não é produtor e está criptografado: mascarar
    if (!isProducer && isEncrypted) {
      return <span className="text-muted-foreground/50">••••••••••</span>;
    }

    // Valor legado não criptografado ou vazio
    return customer.phone || "—";
  };

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

  const handleViewDetails = (customer: Customer) => {
    setSelectedOrder(customer);
    setIsDialogOpen(true);
  };

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

  const handleExportExcel = () => {
    const headers = ['ID', 'Oferta', 'Cliente', 'Email', 'Telefone', 'Criado em', 'Valor', 'Status'];
    const rows = filteredCustomers.map(customer => [
      customer.id, customer.offer, customer.client, customer.email, customer.phone, customer.createdAt, customer.value, customer.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-2xl blur-xl opacity-20" />
        <div className="relative bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 hover:border-primary/20 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5">
          <div className="space-y-6">
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
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-background/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/50 transition-all"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-background/50 border-border/50 hover:bg-muted/50 hover:text-primary hover:border-primary/20 transition-all"
                  onClick={handleRefresh}
                  disabled={isLoading || isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-background/50 border-border/50 hover:bg-muted/50 hover:text-primary hover:border-primary/20 transition-all"
                  onClick={handleExportExcel}
                  disabled={filteredCustomers.length === 0}
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              </div>
            </div>

            <div className="border border-border/30 rounded-xl overflow-hidden bg-background/20 backdrop-blur-sm overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/50 border-border/30">
                    <TableHead className="text-muted-foreground font-medium">ID</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Oferta</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Cliente</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Telefone</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Criado em</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Valor</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-border/30">
                        <TableCell><Skeleton className="h-4 w-20 bg-primary/10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24 bg-primary/10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32 bg-primary/10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28 bg-primary/10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24 bg-primary/10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20 bg-primary/10" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 bg-primary/10" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24 bg-primary/10 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 border-border/30">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <div className="p-4 bg-muted/30 rounded-full mb-2">
                            <Search className="w-8 h-8 opacity-50" />
                          </div>
                          <p className="text-base font-medium text-foreground">
                            {searchTerm ? "Nenhum resultado encontrado" : "Nenhum cliente ainda"}
                          </p>
                          <p className="text-sm opacity-70">
                            {searchTerm ? "Tente ajustar sua busca" : "Quando você tiver clientes, eles aparecerão aqui com suas compras."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCustomers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-muted/30 border-border/30 transition-colors group">
                        <TableCell className="font-mono text-sm text-foreground/70 group-hover:text-foreground transition-colors">{customer.id}</TableCell>
                        <TableCell className="text-sm font-medium text-foreground">{customer.offer}</TableCell>
                        <TableCell className="text-sm text-foreground/80">{customer.client}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{getDisplayPhone(customer)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{customer.createdAt}</TableCell>
                        <TableCell className="text-sm font-semibold text-foreground">{customer.value}</TableCell>
                        <TableCell>
                          <Badge
                            variant={customer.status === "Pago" ? "default" : "secondary"}
                            className={`
                            ${customer.status === "Pago"
                                ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}
                            transition-all
                          `}
                          >
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 hover:bg-muted/50 hover:text-primary transition-all"
                            onClick={() => handleViewDetails(customer)}
                          >
                            <Eye className="w-4 h-4" />
                            <span className="sr-only sm:not-sr-only sm:inline-block">Ver</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {!isLoading && filteredCustomers.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground pt-2">
                <span>
                  Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)} de {filteredCustomers.length} registros
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentPage === 1}
                    onClick={handlePrevious}
                    className="h-8 w-8 hover:bg-muted/50 hover:text-primary"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-1 mx-2">
                    {pageNumbers.map((page, index) => {
                      if (page === 'ellipsis') return <span key={`ellipsis-${index}`} className="px-2">...</span>;

                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handlePageChange(page as number)}
                          className={`h-8 w-8 p-0 ${page === currentPage ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "hover:bg-muted/50 hover:text-primary"}`}
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
                    onClick={handleNext}
                    className="h-8 w-8 hover:bg-muted/50 hover:text-primary"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
