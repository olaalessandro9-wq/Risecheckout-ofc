/**
 * AffiliatesTable Component
 * 
 * Tabela de afiliados com ações.
 */

import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AffiliateActions } from "./AffiliateActions";

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

interface AffiliatesTableProps {
  affiliates: AffiliateData[];
  loading: boolean;
  actionLoading: string | null;
  onEdit: (affiliate: AffiliateData) => void;
  onAction: (affiliateId: string, action: "approve" | "reject" | "block" | "unblock") => void;
}

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

export function AffiliatesTable({
  affiliates,
  loading,
  actionLoading,
  onEdit,
  onAction,
}: AffiliatesTableProps) {
  return (
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
                  <CommissionCell affiliate={affiliate} />
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
                  <AffiliateActions
                    affiliateId={affiliate.id}
                    status={affiliate.status}
                    isLoading={actionLoading === affiliate.id}
                    onEdit={() => onEdit(affiliate)}
                    onAction={(action) => onAction(affiliate.id, action)}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function CommissionCell({ affiliate }: { affiliate: AffiliateData }) {
  const defaultRate = affiliate.product_settings?.defaultRate ?? 50;
  const effectiveRate = affiliate.commission_rate ?? defaultRate;
  const isCustom = affiliate.commission_rate !== null && affiliate.commission_rate !== defaultRate;
  
  if (isCustom) {
    return (
      <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
        {effectiveRate}% (Custom)
      </Badge>
    );
  }
  
  return (
    <span className="text-sm text-muted-foreground">
      {effectiveRate}%
    </span>
  );
}
