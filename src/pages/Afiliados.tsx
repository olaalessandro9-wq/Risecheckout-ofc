/**
 * Afiliados Page (REFATORADO)
 * 
 * Gerenciamento de afiliados pelo produtor.
 * 
 * Arquitetura modular:
 * - AffiliatesMetrics: Cards de métricas
 * - AffiliatesTable: Tabela com ações
 * - EditCommissionDialog: Modal de edição
 */

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/api-client";
import { toast } from "sonner";
import { getProducerAffiliatesRpc } from "@/lib/rpc/rpcProxy";
import { createLogger } from "@/lib/logger";

const log = createLogger("Afiliados");

import {
  AffiliatesMetrics,
  AffiliatesTable,
  EditCommissionDialog,
} from "@/components/affiliates";

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

  // Debounce do termo de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchAffiliates = useCallback(async () => {
    try {
      setLoading(true);
      
      const result = await getProducerAffiliatesRpc(debouncedSearchTerm);
      
      if (result.error) throw result.error;
      
      const data = result.data as unknown as AffiliateData[] | null;

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
    } catch (error: unknown) {
      log.error("Erro ao buscar afiliados:", error);
      toast.error("Erro ao carregar lista de afiliados.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  // --- Handlers ---

  const handleAction = async (affiliationId: string, action: "approve" | "reject" | "block" | "unblock") => {
    try {
      setActionLoading(affiliationId);
      
      // Usar invokeEdgeFunction que inclui X-Producer-Session-Token automaticamente
      const { data, error } = await invokeEdgeFunction<{ success: boolean; message?: string; error?: string }>('manage-affiliation', {
        affiliation_id: affiliationId,
        action
      });

      if (error) throw new Error(error);
      if (!data?.success) throw new Error(data?.error || "Erro ao processar ação");

      toast.success(data.message || "Ação realizada com sucesso!");
      fetchAffiliates();
    } catch (error: unknown) {
      log.error("handleAction Erro:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar ação");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (affiliate: AffiliateData) => {
    setSelectedAffiliate(affiliate);
    setCustomCommission(affiliate.commission_rate ? affiliate.commission_rate.toString() : "");
    setIsEditDialogOpen(true);
  };

  const handleSaveCustomCommission = async () => {
    if (!selectedAffiliate) return;

    try {
      const newRate = customCommission === '' ? null : parseInt(customCommission);
      
      if (newRate !== null && (newRate < 1 || newRate > 90)) {
        toast.error("A comissão deve ser entre 1% e 90%");
        return;
      }

      // Usar Edge Function existente (PROTOCOLO: Zero bypass direto)
      const { data, error } = await invokeEdgeFunction<{ success: boolean; error?: string; message?: string }>("manage-affiliation", {
        affiliation_id: selectedAffiliate.id,
        action: "update_commission",
        commission_rate: newRate,
      });

      if (error) throw new Error(error);
      if (!data?.success) throw new Error(data?.error || "Erro ao atualizar comissão");

      toast.success(data.message || 'Comissão atualizada com sucesso!');
      setIsEditDialogOpen(false);
      fetchAffiliates();
    } catch (error: unknown) {
      toast.error("Erro ao salvar comissão: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    }
  };

  const exportToCSV = () => {
    if (affiliates.length === 0) return;
    
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gerenciar Afiliados</h1>
          <p className="text-muted-foreground mt-1">
            Controle solicitações, comissões e performance dos seus parceiros.
          </p>
        </div>
      </div>

      {/* Métricas */}
      <AffiliatesMetrics affiliates={affiliates} />

      {/* Tabela */}
      <Card className="p-6 shadow-sm border-muted">
        {/* Filtros */}
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

        <AffiliatesTable
          affiliates={affiliates}
          loading={loading}
          actionLoading={actionLoading}
          onEdit={handleEdit}
          onAction={handleAction}
        />
      </Card>

      {/* Dialog de Edição */}
      <EditCommissionDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        customCommission={customCommission}
        onCommissionChange={setCustomCommission}
        onSave={handleSaveCustomCommission}
        defaultRate={selectedAffiliate?.product_settings?.defaultRate || 50}
      />
    </div>
  );
};

export default Afiliados;
