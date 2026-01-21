/**
 * Webhooks Manager - Container Component
 * 
 * @module modules/webhooks/components
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { WebhooksProvider, useWebhooks } from "../context/WebhooksContext";
import { WebhooksHeader } from "./WebhooksHeader";
import { WebhooksList } from "./WebhooksList";
import { WebhookFormSheet } from "./WebhookFormSheet";
import { TestWebhookDialog } from "./TestWebhookDialog";
import { WebhookLogsDialog } from "./WebhookLogsDialog";
import { WebhookDeleteDialog } from "./WebhookDeleteDialog";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Container principal do módulo Webhooks
 */
export function WebhooksManager() {
  return (
    <WebhooksProvider>
      <WebhooksContent />
    </WebhooksProvider>
  );
}

/**
 * Conteúdo interno que usa o contexto
 */
function WebhooksContent() {
  const { isLoading, isError, error, refresh } = useWebhooks();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-sm text-destructive">{error || "Erro ao carregar webhooks"}</p>
        <Button variant="outline" onClick={refresh}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <WebhooksHeader />
        <WebhooksList />
      </div>

      {/* Dialogs/Sheets */}
      <WebhookFormSheet />
      <WebhookDeleteDialog />
      <TestWebhookDialog />
      <WebhookLogsDialog />
    </>
  );
}
