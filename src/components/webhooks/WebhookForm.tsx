/**
 * WebhookForm - Formulário de Webhook
 * 
 * MIGRATED: Uses Edge Function instead of supabase.from()
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Checkbox } from "@/components/ui/checkbox";
import { getProducerSessionToken } from "@/hooks/useProducerAuth";

interface WebhookFormProps {
  webhook?: {
    id: string;
    name: string;
    url: string;
    events: string[];
    product_id: string | null;
  };
  onSave: (data: {
    name: string;
    url: string;
    events: string[];
    product_ids: string[];
  }) => Promise<void>;
  onCancel: () => void;
}

const AVAILABLE_EVENTS = [
  { value: "pix_generated", label: "PIX Gerado" },
  { value: "purchase_approved", label: "Compra aprovada" },
  { value: "purchase_refused", label: "Compra recusada" },
  { value: "refund", label: "Reembolso" },
  { value: "chargeback", label: "Chargeback" },
  { value: "checkout_abandoned", label: "Abandono de checkout" },
];

interface Product {
  id: string;
  name: string;
}

export function WebhookForm({ webhook, onSave, onCancel }: WebhookFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState(webhook?.name || "");
  const [url, setUrl] = useState(webhook?.url || "");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    webhook?.events || ["purchase_approved"]
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isEditing = !!webhook;

  useEffect(() => {
    loadProducts();
  }, [user]);

  // Carregar produtos do webhook DEPOIS que a lista de produtos estiver carregada
  useEffect(() => {
    if (products.length > 0 && webhook?.id) {
      console.log("📦 Produtos carregados, agora carregando seleção do webhook");
      loadWebhookProducts(webhook.id);
    } else if (webhook?.product_id) {
      // Fallback para webhooks antigos
      setSelectedProductIds([webhook.product_id]);
    } else if (!webhook?.id) {
      // Reset ao criar novo webhook
      setSelectedProductIds([]);
    }
  }, [products, webhook?.id, webhook?.product_id]);

  /**
   * Load products via Edge Function
   * MIGRATED: Uses webhook-crud instead of supabase.from()
   */
  const loadProducts = async () => {
    if (!user?.id) {
      console.log("User not loaded yet, skipping products load");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const sessionToken = getProducerSessionToken();
      
      const { data, error } = await supabase.functions.invoke('webhook-crud', {
        body: {
          action: 'list-user-products',
          sessionToken,
        }
      });

      if (error) {
        console.error("Error loading products:", error);
        toast.error("Erro ao carregar produtos");
        return;
      }
      
      if (!data?.success) {
        console.error("Error loading products:", data?.error);
        toast.error("Erro ao carregar produtos");
        return;
      }
      
      setProducts(data.products || []);
    } catch (error: unknown) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load webhook products via Edge Function
   * MIGRATED: Uses webhook-crud instead of supabase.from()
   */
  const loadWebhookProducts = async (webhookId: string) => {
    try {
      const sessionToken = getProducerSessionToken();
      
      const { data, error } = await supabase.functions.invoke('webhook-crud', {
        body: {
          action: 'get-webhook-products',
          webhookId,
          sessionToken,
        }
      });

      if (error || !data?.success) {
        console.error("Error loading webhook products:", error || data?.error);
        // Fallback: usar product_id do webhook (compatibilidade com webhooks antigos)
        if (webhook?.product_id) {
          console.log("🔍 Usando product_id do webhook (fallback):", webhook.product_id);
          setSelectedProductIds([webhook.product_id]);
        } else {
          setSelectedProductIds([]);
        }
        return;
      }

      const productIds = data.productIds || [];
      console.log("🔍 Produtos do webhook carregados:", productIds);
      setSelectedProductIds(productIds);
    } catch (error: unknown) {
      console.error("Error loading webhook products:", error);
      setSelectedProductIds([]);
    }
  };

  const handleEventChange = (event: string) => {
    setSelectedEvents((prev) => {
      if (prev.includes(event)) {
        return prev.filter((e) => e !== event);
      }
      return [...prev, event];
    });
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProductIds((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      if (current.includes(productId)) {
        return current.filter((id) => id !== productId);
      }
      return [...current, productId];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!url.trim()) {
      toast.error("URL é obrigatória");
      return;
    }

    if (!Array.isArray(selectedProductIds) || selectedProductIds.length === 0) {
      toast.error("Selecione pelo menos um produto");
      return;
    }

    if (selectedEvents.length === 0) {
      toast.error("Selecione pelo menos um evento");
      return;
    }

    // Validar URL
    try {
      new URL(url);
    } catch {
      toast.error("URL inválida");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        url: url.trim(),
        events: selectedEvents,
        product_ids: selectedProductIds,
      });
    } catch (error: unknown) {
      console.error("Erro ao salvar webhook:", error);
      toast.error("Erro ao salvar webhook");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="webhook-name" style={{ color: "var(--text)" }}>
          Nome <span className="text-red-500">*</span>
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

      <div className="space-y-2">
        <Label htmlFor="webhook-url" style={{ color: "var(--text)" }}>
          URL <span className="text-red-500">*</span>
        </Label>
        <Input
          id="webhook-url"
          type="url"
          placeholder="http://72.60.249.53:5678/webhook/welcome"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="font-mono text-sm"
          required
        />
      </div>

      <div className="space-y-2">
        <Label style={{ color: "var(--text)" }}>
          Produto <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-muted-foreground">
          Selecione os produtos
        </p>
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
                  checked={Array.isArray(selectedProductIds) && selectedProductIds.includes(product.id)}
                  onCheckedChange={() => {
                    console.log("🔘 Toggle produto:", product.id, "Selecionados:", selectedProductIds);
                    handleProductToggle(product.id);
                  }}
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
          {Array.isArray(selectedProductIds) ? selectedProductIds.length : 0} produto(s) selecionado(s)
        </p>
      </div>

      <div className="space-y-2">
        <Label style={{ color: "var(--text)" }}>
          Eventos <span className="text-red-500">*</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_EVENTS.map((event) => (
            <button
              key={event.value}
              type="button"
              onClick={() => handleEventChange(event.value)}
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

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
