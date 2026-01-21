/**
 * AlertsList - Lista de Alertas de Segurança
 * 
 * Componente puro que exibe a tabela de alertas com filtros.
 * 
 * @version 1.0.0
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { AlertCard, type SecurityAlert } from "./AlertCard";

interface AlertFilters {
  severity: string;
  type: string;
  acknowledged: string;
}

interface AlertsListProps {
  alerts: SecurityAlert[];
  filters: AlertFilters;
  isLoading: boolean;
  onFilterChange: (key: keyof AlertFilters, value: string) => void;
  onRefresh: () => void;
  onAcknowledge: (alertId: string) => void;
  onViewDetails: (alert: SecurityAlert) => void;
}

const SEVERITY_OPTIONS = [
  { value: "all", label: "Todas Severidades" },
  { value: "critical", label: "Crítico" },
  { value: "high", label: "Alto" },
  { value: "medium", label: "Médio" },
  { value: "low", label: "Baixo" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "Todos os Tipos" },
  { value: "brute_force", label: "Força Bruta" },
  { value: "rate_limit", label: "Rate Limit" },
  { value: "suspicious_activity", label: "Atividade Suspeita" },
  { value: "failed_login", label: "Login Falhou" },
  { value: "ip_blocked", label: "IP Bloqueado" },
];

const ACK_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendentes" },
  { value: "acknowledged", label: "Reconhecidos" },
];

export function AlertsList({
  alerts,
  filters,
  isLoading,
  onFilterChange,
  onRefresh,
  onAcknowledge,
  onViewDetails,
}: AlertsListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas de Segurança
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-4 pt-4">
          <Select
            value={filters.severity}
            onValueChange={(value) => onFilterChange("severity", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              {SEVERITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.type}
            onValueChange={(value) => onFilterChange("type", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.acknowledged}
            onValueChange={(value) => onFilterChange("acknowledged", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {ACK_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum alerta encontrado com os filtros selecionados.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severidade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={onAcknowledge}
                  onViewDetails={onViewDetails}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
