/**
 * AffiliationsTable - Tabela de afiliações no padrão Cakto
 * 
 * Colunas: Data | Produto | Comissão | Status | Ações
 * Menu de ações: Cancelar Afiliação (apenas para status active)
 */

import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, XCircle } from "lucide-react";
import type { Affiliation } from "@/hooks/useAffiliations";

interface AffiliationsTableProps {
  affiliations: Affiliation[];
  onCancelAffiliation: (id: string) => Promise<boolean>;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Ativo", variant: "default" },
  pending: { label: "Analisando", variant: "secondary" },
  blocked: { label: "Bloqueado", variant: "destructive" },
  rejected: { label: "Bloqueado", variant: "destructive" },
  inactive: { label: "Inativo", variant: "outline" },
};

function formatDate(dateString: string): string {
  return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
}

export function AffiliationsTable({ affiliations, onCancelAffiliation }: AffiliationsTableProps) {
  const navigate = useNavigate();

  const handleRowClick = (id: string) => {
    navigate(`/dashboard/minhas-afiliacoes/${id}`);
  };

  const handleCancel = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await onCancelAffiliation(id);
  };

  if (affiliations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-muted-foreground">Você ainda não é afiliado de nenhum produto.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Produto</TableHead>
          <TableHead>Comissão</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {affiliations.map((item) => {
          const statusInfo = STATUS_MAP[item.status] || STATUS_MAP.inactive;
          const isActive = item.status === "active";

          return (
            <TableRow
              key={item.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleRowClick(item.id)}
            >
              <TableCell className="text-muted-foreground">
                {formatDate(item.created_at)}
              </TableCell>
              <TableCell className="font-medium">
                {item.product?.name || "Produto sem nome"}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-bold text-success-foreground bg-success/10">
                  {item.commission_rate}%
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusInfo.variant}>
                  {statusInfo.label}
                </Badge>
              </TableCell>
              <TableCell>
                {isActive && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => handleCancel(e, item.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancelar Afiliação
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
