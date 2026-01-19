/**
 * WebhooksConfig - Configuração de Webhooks
 * 
 * @version 2.0.0 - RISE Protocol V3 - Zero console.log
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { WebhooksList } from "./WebhooksList";
import { WebhookForm } from "./WebhookForm";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createLogger } from "@/lib/logger";

const log = createLogger("WebhooksConfig");

interface WebhookCrudResponse {
  success?: boolean;
  error?: string;
  webhooks?: WebhookData[];
  products?: Product[];
}

interface WebhookData {
  id: string;
  name: string;
  url: string;
  events: string[];
  product_id: string | null;
  created_at: string;
  product?: {
    name: string;
  };
}

interface Product {
  id: string;
  name: string;
}

export function WebhooksConfig() {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  /**
   * Load data via Edge Function
   * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
   */
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar produtos e webhooks via Edge Function
      const { data, error } = await api.call<WebhookCrudResponse>('webhook-crud', {
        action: 'list-with-products',
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao carregar dados");
      
      setProducts(data.products || []);
      setWebhooks(data.webhooks || []);
    } catch (error: unknown) {
      log.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: {
    name: string;
    url: string;
    events: string[];
    product_ids: string[];
  }) => {
    try {
      if (editingWebhook) {
        // Atualizar webhook existente via Edge Function
        const { data: result, error } = await api.call<WebhookCrudResponse>('webhook-crud', {
          action: 'update',
          webhookId: editingWebhook.id,
          data: {
            name: data.name,
            url: data.url,
            events: data.events,
            product_ids: data.product_ids,
          },
        });

        if (error || !result?.success) {
          throw new Error(result?.error || error?.message || "Erro ao atualizar webhook");
        }

        toast.success("Webhook atualizado com sucesso!");
      } else {
        // Criar novo webhook via Edge Function
        const { data: result, error } = await api.call<WebhookCrudResponse>('webhook-crud', {
          action: 'create',
          data: {
            name: data.name,
            url: data.url,
            events: data.events,
            product_ids: data.product_ids,
          },
        });

        if (error || !result?.success) {
          throw new Error(result?.error || error?.message || "Erro ao criar webhook");
        }

        toast.success("Webhook criado com sucesso!");
      }

      setSheetOpen(false);
      setEditingWebhook(null);
      loadData();
    } catch (error: unknown) {
      log.error("Error saving webhook:", error);
      throw error;
    }
  };

  const handleEdit = (webhook: WebhookData) => {
    setEditingWebhook(webhook);
    setSheetOpen(true);
  };

  const handleDelete = async (webhookId: string) => {
    try {
      const { data: result, error } = await api.call<WebhookCrudResponse>('webhook-crud', {
        action: 'delete',
        webhookId,
      });

      if (error || !result?.success) {
        throw new Error(result?.error || error?.message || "Erro ao excluir webhook");
      }

      toast.success("Webhook excluído com sucesso!");
      loadData();
    } catch (error: unknown) {
      log.error("Error deleting webhook:", error);
      toast.error("Erro ao excluir webhook");
      throw error;
    }
  };

  const handleCancel = () => {
    setSheetOpen(false);
    setEditingWebhook(null);
  };

  const handleNewWebhook = () => {
    setEditingWebhook(null);
    setSheetOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header com busca e filtros */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleNewWebhook}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Lista de webhooks */}
        <WebhooksList
          webhooks={webhooks}
          onEdit={handleEdit}
          onDelete={handleDelete}
          selectedProduct={selectedProduct}
        />
      </div>

      {/* Sheet lateral para criar/editar */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingWebhook ? "Editar Webhook" : "Novo Webhook"}
            </SheetTitle>
            <SheetDescription>
              Configure as integrações com os seus apps
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <WebhookForm
              webhook={editingWebhook || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
