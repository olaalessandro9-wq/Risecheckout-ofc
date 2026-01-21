/**
 * Test Webhook Dialog
 * 
 * @module modules/webhooks/components
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import { useWebhooks } from "../context/WebhooksContext";
import { WEBHOOK_EVENTS } from "../constants/events";
import type { WebhookTestResponse, WebhookEventType } from "../types";

const log = createLogger("TestWebhookDialog");

export function TestWebhookDialog() {
  const { testingWebhook, closeTest } = useWebhooks();
  const [selectedEvent, setSelectedEvent] = useState<WebhookEventType | "">("");
  const [sending, setSending] = useState(false);

  const isOpen = !!testingWebhook;

  const handleSendTest = async () => {
    if (!selectedEvent || !testingWebhook) {
      toast.error("Selecione um evento");
      return;
    }

    setSending(true);
    try {
      // Create test payload
      const testPayload = buildTestPayload(selectedEvent, testingWebhook.url);

      const { data: result, error } = await api.call<WebhookTestResponse>(
        "send-webhook-test",
        {
          webhook_id: testingWebhook.id,
          webhook_url: testingWebhook.url,
          event_type: selectedEvent,
          payload: testPayload,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (result?.success) {
        toast.success(`Evento de teste enviado! Status: ${result.status_code}`);
        closeTest();
        setSelectedEvent("");
      } else {
        toast.error(`Erro ao enviar: ${result?.error || "Erro desconhecido"}`);
      }
    } catch (error: unknown) {
      log.error("Error sending test event:", error);
      toast.error("Erro ao enviar evento de teste");
    } finally {
      setSending(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeTest();
      setSelectedEvent("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Evento de Teste</DialogTitle>
          <DialogDescription>
            Teste seu webhook enviando um evento simulado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Webhook Info */}
          <div className="space-y-2">
            <Label>Webhook</Label>
            <p className="text-sm font-medium">{testingWebhook?.name}</p>
            <p className="text-xs font-mono text-muted-foreground">
              {testingWebhook?.url}
            </p>
          </div>

          {/* Event Selection */}
          <div className="space-y-2">
            <Label htmlFor="test-event">
              Evento <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedEvent}
              onValueChange={(v) => setSelectedEvent(v as WebhookEventType)}
            >
              <SelectTrigger id="test-event">
                <SelectValue placeholder="Selecione um evento" />
              </SelectTrigger>
              <SelectContent>
                {WEBHOOK_EVENTS.map((event) => (
                  <SelectItem key={event.value} value={event.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{event.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {event.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              ℹ️ Este é um evento de teste. O payload será marcado com{" "}
              <code className="bg-background px-1 rounded">test_mode: true</code>{" "}
              e o header{" "}
              <code className="bg-background px-1 rounded">X-Rise-Test: true</code>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSendTest} disabled={sending || !selectedEvent}>
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar Teste
            </Button>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Build test payload for webhook
 */
function buildTestPayload(eventType: WebhookEventType, webhookUrl: string) {
  return {
    id: crypto.randomUUID(),
    status: eventType === "purchase_approved" ? "paid" : "pending",
    totalAmount: 1.89,
    baseAmount: 100,
    discount: 10,
    amount: 90,
    paymentMethod: "credit_card",
    paymentMethodName: "Cartão de Crédito",
    paidAt: eventType === "purchase_approved" ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
    customer: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "34999999999",
      docNumber: "12345678909",
    },
    product: {
      name: "Produto Teste",
      id: crypto.randomUUID(),
    },
    webhookUrl,
    executionMode: "test",
    test_mode: true,
  };
}
