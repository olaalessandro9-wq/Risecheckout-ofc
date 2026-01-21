/**
 * Webhook Logs Dialog
 * 
 * @module modules/webhooks/components
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useWebhooks } from "../context/WebhooksContext";
import { EVENT_LABELS } from "../constants/events";
import type { WebhookDelivery, WebhookEventType } from "../types";

export function WebhookLogsDialog() {
  const { logsWebhook, logs, isLoadingLogs, closeLogs } = useWebhooks();
  const [selectedLog, setSelectedLog] = useState<WebhookDelivery | null>(null);

  const isOpen = !!logsWebhook;

  // Auto-select first log when logs change
  if (logs.length > 0 && !selectedLog) {
    setSelectedLog(logs[0]);
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeLogs();
      setSelectedLog(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Logs</DialogTitle>
          <DialogDescription>
            Histórico de entregas do webhook: {logsWebhook?.name}
          </DialogDescription>
        </DialogHeader>

        {isLoadingLogs ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Nenhum log encontrado ainda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[400px,1fr] gap-6 flex-1 min-h-0">
            {/* Logs List (Left) */}
            <div className="border-r pr-4 flex flex-col min-h-0">
              <div className="grid grid-cols-[2fr,1fr] gap-4 px-4 py-2 text-sm font-medium border-b flex-shrink-0 text-muted-foreground">
                <div>Descrição</div>
                <div className="text-right">Status</div>
              </div>

              <ScrollArea className="flex-1 mt-2">
                <div className="space-y-2 pr-4">
                  {logs.map((logItem) => (
                    <div
                      key={logItem.id}
                      onClick={() => setSelectedLog(logItem)}
                      className={`grid grid-cols-[2fr,1fr] gap-4 items-center px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedLog?.id === logItem.id
                          ? "bg-accent border-primary"
                          : "border-border hover:bg-accent/50"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {EVENT_LABELS[logItem.event_type as WebhookEventType] ||
                            logItem.event_type}
                        </p>
                        <p className="text-xs truncate text-muted-foreground">
                          {formatDate(logItem.created_at)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <StatusBadge
                          status={logItem.status}
                          statusCode={logItem.response_status}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Details Panel (Right) */}
            <div className="flex flex-col min-h-0">
              {selectedLog ? (
                <ScrollArea className="flex-1">
                  <LogDetails log={selectedLog} />
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center flex-1">
                  <p className="text-sm text-muted-foreground">
                    Selecione um log para ver os detalhes
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatusBadge({
  status,
  statusCode,
}: {
  status: string;
  statusCode: number | null;
}) {
  if (status === "success" && statusCode && statusCode >= 200 && statusCode < 300) {
    return <Badge className="bg-green-600">{statusCode}</Badge>;
  }
  if (statusCode && statusCode >= 400) {
    return <Badge variant="destructive">{statusCode}</Badge>;
  }
  if (status === "pending") {
    return <Badge variant="secondary">Pendente</Badge>;
  }
  if (status === "failed") {
    return <Badge variant="destructive">Falhou</Badge>;
  }
  return <Badge className="bg-green-600">{statusCode || "Sucesso"}</Badge>;
}

function LogDetails({ log }: { log: WebhookDelivery }) {
  const webhookUrl =
    typeof log.payload === "object" && log.payload !== null && "webhook_url" in log.payload
      ? String(log.payload.webhook_url)
      : "N/A";

  return (
    <div className="space-y-4 pr-4">
      <h3 className="text-lg font-semibold">Detalhes</h3>

      {/* Destination URL */}
      <div>
        <p className="text-xs font-medium mb-1 text-muted-foreground">
          URL de destino:
        </p>
        <p className="text-sm font-mono bg-accent px-3 py-2 rounded break-all">
          {webhookUrl}
        </p>
      </div>

      {/* Send Date */}
      <div>
        <p className="text-xs font-medium mb-1 text-muted-foreground">
          Data de envio:
        </p>
        <p className="text-sm">{formatDate(log.created_at)}</p>
      </div>

      {/* Order ID */}
      {log.order_id && (
        <div>
          <p className="text-xs font-medium mb-1 text-muted-foreground">
            Order ID:
          </p>
          <p className="text-sm font-mono bg-accent px-3 py-2 rounded break-all">
            {log.order_id}
          </p>
        </div>
      )}

      {/* Status */}
      <div>
        <p className="text-xs font-medium mb-1 text-muted-foreground">Status:</p>
        <div className="flex items-center gap-2">
          <StatusBadge status={log.status} statusCode={log.response_status} />
          <span className="text-xs text-muted-foreground">
            {log.attempts} tentativa(s)
          </span>
        </div>
      </div>

      {/* Response Body */}
      {log.response_body && (
        <div>
          <p className="text-xs font-medium mb-1 text-muted-foreground">
            Resposta:
          </p>
          <pre className="text-xs bg-accent px-3 py-2 rounded overflow-auto max-h-32 whitespace-pre-wrap break-all">
            {log.response_body}
          </pre>
        </div>
      )}

      {/* Payload */}
      <div>
        <p className="text-xs font-medium mb-1 text-muted-foreground">
          Conteúdo Enviado:
        </p>
        <pre className="text-xs bg-accent px-3 py-2 rounded overflow-auto max-h-[400px] whitespace-pre-wrap break-all">
          {JSON.stringify(log.payload, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
