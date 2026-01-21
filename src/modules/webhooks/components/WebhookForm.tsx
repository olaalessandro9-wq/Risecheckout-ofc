/**
 * Webhook Form Component
 * 
 * @module modules/webhooks/components
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWebhooks } from "../context/WebhooksContext";
import { WEBHOOK_EVENTS, DEFAULT_EVENTS } from "../constants/events";
import type { WebhookEventType } from "../types";

export function WebhookForm() {
  const {
    editingWebhook,
    editingProductIds,
    products,
    isSaving,
    isLoading,
    saveWebhook,
    setEditingProductIds,
    closeForm,
  } = useWebhooks();

  // Local form state
  const [name, setName] = useState(editingWebhook?.name || "");
  const [url, setUrl] = useState(editingWebhook?.url || "");
  const [selectedEvents, setSelectedEvents] = useState<WebhookEventType[]>(
    (editingWebhook?.events as WebhookEventType[]) || [...DEFAULT_EVENTS]
  );

  // Sync editingProductIds when editing webhook changes
  useEffect(() => {
    if (!editingWebhook) {
      // Reset form for new webhook
      setName("");
      setUrl("");
      setSelectedEvents([...DEFAULT_EVENTS]);
    } else {
      // Load existing webhook data
      setName(editingWebhook.name);
      setUrl(editingWebhook.url);
      setSelectedEvents(editingWebhook.events as WebhookEventType[]);
    }
  }, [editingWebhook]);

  const handleEventToggle = (event: WebhookEventType) => {
    setSelectedEvents((prev) => {
      if (prev.includes(event)) {
        return prev.filter((e) => e !== event);
      }
      return [...prev, event];
    });
  };

  const handleProductToggle = (productId: string) => {
    const current = Array.isArray(editingProductIds) ? editingProductIds : [];
    if (current.includes(productId)) {
      setEditingProductIds(current.filter((id) => id !== productId));
    } else {
      setEditingProductIds([...current, productId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!url.trim()) {
      toast.error("URL é obrigatória");
      return;
    }

    if (!Array.isArray(editingProductIds) || editingProductIds.length === 0) {
      toast.error("Selecione pelo menos um produto");
      return;
    }

    if (selectedEvents.length === 0) {
      toast.error("Selecione pelo menos um evento");
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      toast.error("URL inválida");
      return;
    }

    // Save via XState
    saveWebhook({
      name: name.trim(),
      url: url.trim(),
      events: selectedEvents,
      product_ids: editingProductIds,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="webhook-name">
          Nome <span className="text-destructive">*</span>
        </Label>
        <Input
          id="webhook-name"
          type="text"
          placeholder="Ex: N8N NOVO"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* URL Field */}
      <div className="space-y-2">
        <Label htmlFor="webhook-url">
          URL <span className="text-destructive">*</span>
        </Label>
        <Input
          id="webhook-url"
          type="url"
          placeholder="https://example.com/webhook"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="font-mono text-sm"
          required
        />
      </div>

      {/* Products Selection */}
      <div className="space-y-2">
        <Label>
          Produto <span className="text-destructive">*</span>
        </Label>
        <p className="text-sm text-muted-foreground">Selecione os produtos</p>
        <div className="max-h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum produto encontrado
            </p>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md"
              >
                <Checkbox
                  id={`product-${product.id}`}
                  checked={
                    Array.isArray(editingProductIds) &&
                    editingProductIds.includes(product.id)
                  }
                  onCheckedChange={() => handleProductToggle(product.id)}
                />
                <label
                  htmlFor={`product-${product.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  {product.name}
                </label>
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {Array.isArray(editingProductIds) ? editingProductIds.length : 0}{" "}
          produto(s) selecionado(s)
        </p>
      </div>

      {/* Events Selection */}
      <div className="space-y-2">
        <Label>
          Eventos <span className="text-destructive">*</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {WEBHOOK_EVENTS.map((event) => (
            <button
              key={event.value}
              type="button"
              onClick={() => handleEventToggle(event.value)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                selectedEvents.includes(event.value)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-accent"
              }`}
            >
              {event.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar
        </Button>
        <Button type="button" variant="outline" onClick={closeForm}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
