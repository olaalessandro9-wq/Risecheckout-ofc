import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, Download, RefreshCw, Check, X, Ban, MoreVertical, Loader2, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Interface atualizada para RPC v2
interface AffiliateData {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  product_settings: { defaultRate?: number };
  affiliate_name: string;
  affiliate_email: string;
  status: "pending" | "active" | "rejected" | "blocked" | "cancelled";
  commission_rate: number | null;
  affiliate_code: string | null;
  total_sales_count: number;
  total_sales_amount: number;
  created_at: string;
}

const Afiliados = () => {
  const [affiliates, setAffiliates] = useState<AffiliateData[]>([]);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Estados para Edição de Comissão
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateData | null>(null);
  const [customCommission, setCustomCommission] = useState("");

  // Implementação manual de Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchAffiliates = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_producer_affiliates' as any, {
        search_term: debouncedSearchTerm
      });

      if (error) throw error;

      let filteredData = (data as AffiliateData[] | null) || [];
      
      if (statusFilter !== "Todos") {
        const statusMap: Record<string, string> = {
          "Aprovado": "active",
          "Pendente": "pending",
          "Recusado": "rejected",
          "Bloqueado": "blocked",
          "Cancelado": "cancelled",
        };
        filteredData = filteredData.filter(item => item.status === statusMap[statusFilter]);
      }

      setAffiliates(filteredData);
    } catch (error: any) {
      console.error("Erro ao buscar afiliados:", error);
      toast.error("Erro ao carregar lista de afiliados.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  // --- Lógica de Ações ---

  const handleAction = async (affiliationId: string, action: "approve" | "reject" | "block" | "unblock") => {
    try {
      setActionLoading(affiliationId);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-affiliation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ affiliation_id: affiliationId, action }),
        }
      );

      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Erro ao processar ação");

      toast.success(result.message);
      fetchAffiliates();

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  // --- Lógica de Edição de Comissão ---

  const handleEdit = (affiliate: AffiliateData) => {
    setSelectedAffiliate(affiliate);
    setCustomCommission(affiliate.commission_rate ? affiliate.commission_rate.toString() : "");
    setIsEditDialogOpen(true);
  };

  const handleSaveCustomCommission = async () => {
    if (!selectedAffiliate) return;

    try {
      const newRate = customCommission === '' ? null : parseInt(customCommission);
      
      if (newRate !== null && (newRate < 0 || newRate > 100)) {
        toast.error("A comissão deve ser entre 0% e 100%");
        return;
      }

      const { error } = await supabase
        .from('affiliates')
        .update({ 
          commission_rate: newRate,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedAffiliate.id);

      if (error) throw error;

      toast.success('Comissão atualizada com sucesso!');
      setIsEditDialogOpen(false);
      fetchAffiliates();
    } catch (error: any) {
      toast.error("Erro ao salvar comissão: " + error.message);
    }
  };

  const exportToCSV = () => {
    if (affiliates.length === 0) return;
    const headers = ["Nome", "Email", "Produto", "Status", "Comissão", "Vendas", "Receita", "Código", "Data"];
    const rows = affiliates.map(aff => [
      aff.affiliate_name,
      aff.affiliate_email,
      aff.product_name,
      translateStatus(aff.status),
      aff.commission_rate ? `${aff.commission_rate}%` : `Padrão (${aff.product_settings?.defaultRate || 50}%)`,
      aff.total_sales_count.toString(),
      `R$ ${(aff.total_sales_amount / 100).toFixed(2)}`,
      aff.affiliate_code || "-",
      new Date(aff.created_at).toLocaleDateString("pt-BR"),
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `afiliados-rise-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório baixado!");
  };

  const translateStatus = (status: string): string => {
    const map: Record<string, string> = {
      active: "Aprovado",
      pending: "Pendente",
      rejected: "Recusado",
      blocked: "Bloqueado",
      cancelled: "Cancelado",
    };
    return map[status] || status;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "pending": return "secondary";
      case "rejected": return "outline";
      case "blocked": return "destructive";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gerenciar Afiliados</h1>
          <p className="text-muted-foreground mt-1">
            Controle solicitações, comissões e performance dos seus parceiros.
          </p>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: affiliates.length, color: "text-primary" },
          { label: "Aprovados", value: affiliates.filter(a => a.status === "active").length, color: "text-green-600" },
          { label: "Pendentes", value: affiliates.filter(a => a.status === "pending").length, color: "text-amber-600" },
          { label: "Recusados, Bloqueados e Cancelados", value: affiliates.filter(a => a.status === "rejected" || a.status === "blocked" || a.status === "cancelled").length, color: "text-red-600" },
        ].map((stat, i) => (
          <Card key={i} className="p-4 border-l-4 border-l-primary/10 hover:border-l-primary transition-colors">
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 shadow-sm border-muted">
        <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Status</SelectItem>
                <SelectItem value="Aprovado">Aprovados</SelectItem>
                <SelectItem value="Pendente">Pendentes</SelectItem>
                <SelectItem value="Recusado">Recusados</SelectItem>
                <SelectItem value="Bloqueado">Bloqueados</SelectItem>
                <SelectItem value="Cancelado">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" size="sm" onClick={fetchAffiliates} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={affiliates.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Afiliado</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Vendas</TableHead>
                <TableHead>Receita Gerada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Carregando dados...
                    </div>
                  </TableCell>
                </TableRow>
              ) : affiliates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Nenhum afiliado encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                affiliates.map((affiliate) => (
                  <TableRow key={affiliate.id} className="group hover:bg-muted/5 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{affiliate.affiliate_name}</span>
                        <span className="text-xs text-muted-foreground">{affiliate.affiliate_email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{affiliate.product_name}</TableCell>
                    <TableCell>
                      {affiliate.commission_rate ? (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                          {affiliate.commission_rate}% (Custom)
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          {affiliate.product_settings?.defaultRate || 50}% (Padrão)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{affiliate.total_sales_count}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      R$ {(affiliate.total_sales_amount / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(affiliate.status)}>
                        {translateStatus(affiliate.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={!!actionLoading}>
                            {actionLoading === affiliate.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MoreVertical className="w-4 h-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Gerenciar</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => handleEdit(affiliate)}>
                             <Pencil className="w-4 h-4 mr-2" /> Editar Comissão
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {affiliate.status === "pending" && (
                            <>
                              <DropdownMenuItem onClick={() => handleAction(affiliate.id, "approve")}>
                                <Check className="w-4 h-4 mr-2 text-green-600" /> Aprovar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction(affiliate.id, "reject")}>
                                <X className="w-4 h-4 mr-2 text-red-600" /> Recusar
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {affiliate.status === "active" && (
                            <DropdownMenuItem onClick={() => handleAction(affiliate.id, "block")} className="text-red-600 focus:text-red-600">
                              <Ban className="w-4 h-4 mr-2" /> Bloquear Acesso
                            </DropdownMenuItem>
                          )}
                          
                          {affiliate.status === "blocked" && (
                            <DropdownMenuItem onClick={() => handleAction(affiliate.id, "unblock")}>
                              <Check className="w-4 h-4 mr-2" /> Desbloquear
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Dialog de Edição de Comissão */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Comissão do Afiliado</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Comissão Personalizada (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={customCommission}
                onChange={(e) => setCustomCommission(e.target.value)}
                placeholder={`Padrão: ${selectedAffiliate?.product_settings?.defaultRate || 50}%`}
              />
              <p className="text-sm text-muted-foreground">
                Deixe vazio para usar a taxa padrão do produto ({selectedAffiliate?.product_settings?.defaultRate || 50}%)
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCustomCommission}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Afiliados;
