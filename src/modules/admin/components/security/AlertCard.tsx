/**
 * AlertCard - Card Individual de Alerta
 * 
 * Componente puro que exibe um alerta de segurança individual.
 * 
 * @version 1.0.0
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Check, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  ip_address: string | null;
  details: Record<string, unknown>;
  acknowledged: boolean;
  created_at: string;
}

interface AlertCardProps {
  alert: SecurityAlert;
  onAcknowledge: (alertId: string) => void;
  onViewDetails: (alert: SecurityAlert) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Médio",
  low: "Baixo",
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  brute_force: "Força Bruta",
  rate_limit: "Rate Limit",
  suspicious_activity: "Atividade Suspeita",
  failed_login: "Login Falhou",
  ip_blocked: "IP Bloqueado",
};

export function AlertCard({ alert, onAcknowledge, onViewDetails }: AlertCardProps) {
  return (
    <TableRow>
      <TableCell>
        <Badge variant="outline" className={SEVERITY_COLORS[alert.severity] || "bg-muted"}>
          {SEVERITY_LABELS[alert.severity] || alert.severity}
        </Badge>
      </TableCell>
      <TableCell>
        {ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
      </TableCell>
      <TableCell className="font-mono text-sm">
        {alert.ip_address || "-"}
      </TableCell>
      <TableCell>
        {format(new Date(alert.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
      </TableCell>
      <TableCell>
        <Badge variant={alert.acknowledged ? "secondary" : "destructive"}>
          {alert.acknowledged ? "Reconhecido" : "Pendente"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(alert)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {!alert.acknowledged && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAcknowledge(alert.id)}
            >
              <Check className="h-4 w-4 mr-1" />
              Reconhecer
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
