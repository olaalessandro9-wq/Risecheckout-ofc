/**
 * Webhooks List Component
 * 
 * @module modules/webhooks/components
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, FileText, MoreVertical, Send, Trash2 } from "lucide-react";
import { useWebhooks } from "../context/WebhooksContext";

export function WebhooksList() {
  const { 
    filteredWebhooks, 
    openForm, 
    requestDelete, 
    openTest, 
    openLogs 
  } = useWebhooks();

  if (filteredWebhooks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">
          Nenhum webhook configurado ainda
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[2fr,3fr] gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
        <div>Nome</div>
        <div>URL</div>
      </div>

      {/* Webhook Items */}
      {filteredWebhooks.map((webhook) => (
        <div
          key={webhook.id}
          className="grid grid-cols-[2fr,3fr,auto] gap-4 items-center px-4 py-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
        >
          <div>
            <p className="font-medium text-sm text-foreground">
              {webhook.name}
            </p>
          </div>

          <div className="font-mono text-xs text-muted-foreground truncate">
            {webhook.url}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openTest(webhook)}>
                <Send className="mr-2 h-4 w-4" />
                Enviar evento de teste
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openForm(webhook)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openLogs(webhook)}>
                <FileText className="mr-2 h-4 w-4" />
                Logs
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => requestDelete(webhook)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}
