/**
 * AlertDetailDialog - Dialog de Detalhes do Alerta
 * 
 * Componente puro que exibe os detalhes de um alerta de segurança.
 * 
 * @version 1.0.0
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { SecurityAlert } from "./AlertCard";

interface AlertDetailDialogProps {
  alert: SecurityAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function AlertDetailDialog({
  alert,
  open,
  onOpenChange,
}: AlertDetailDialogProps) {
  if (!alert) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Detalhes do Alerta
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre o alerta de segurança.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Severidade</p>
              <Badge
                variant="outline"
                className={SEVERITY_COLORS[alert.severity] || "bg-muted"}
              >
                {SEVERITY_LABELS[alert.severity] || alert.severity}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">
                {ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Endereço IP</p>
              <p className="font-mono">{alert.ip_address || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data/Hora</p>
              <p>
                {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm:ss", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={alert.acknowledged ? "secondary" : "destructive"}>
                {alert.acknowledged ? "Reconhecido" : "Pendente"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID do Alerta</p>
              <p className="font-mono text-xs">{alert.id}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Detalhes Técnicos</p>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-48 text-xs">
              {JSON.stringify(alert.details, null, 2)}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
