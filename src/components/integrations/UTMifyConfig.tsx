/**
 * UTMifyConfig
 * 
 * MIGRATED: Uses Edge Function instead of supabase.from()
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getProducerSessionToken } from "@/hooks/useProducerAuth";
import { SUPABASE_URL } from "@/config/supabase";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
}

interface UTMifyEvent {
  id: string;
  label: string;
  description: string;
}

const UTMIFY_EVENTS: UTMifyEvent[] = [
  { id: "pix_generated", label: "PIX Gerado", description: "Quando o QR Code do PIX é gerado" },
  { id: "purchase_approved", label: "Compra Aprovada", description: "Quando o pagamento é confirmado" },
  { id: "purchase_refused", label: "Compra Recusada", description: "Quando o pagamento é recusado (cartão)" },
  { id: "refund", label: "Reembolso", description: "Quando um pedido é reembolsado" },
  { id: "chargeback", label: "Chargeback", description: "Quando ocorre um chargeback" },
  { id: "checkout_abandoned", label: "Abandono de Checkout", description: "Quando o cliente abandona o checkout" },
];

export const UTMifyConfig = () => {
  const { user } = useAuth();
  
  const [utmifyToken, setUtmifyToken] = useState("");
  const [utmifyActive, setUtmifyActive] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [hasExistingToken, setHasExistingToken] = useState(false);
  
  const [productsOpen, setProductsOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadProducts();
      loadUTMifyConfig();
    }
  }, [user]);

  /**
   * Load products via Edge Function
   * MIGRATED: Uses supabase.functions.invoke instead of supabase.from()
   */
  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const sessionToken = getProducerSessionToken();
      
      const { data, error } = await supabase.functions.invoke("products-crud", {
        body: { action: "list" },
        headers: { "x-producer-session-token": sessionToken || "" },
      });

      if (error) throw error;
      
      const productsList = (data?.products || []).filter((p: { status?: string }) => p.status !== "deleted");
      setProducts(productsList);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao carregar produtos: " + errorMessage);
    } finally {
      setLoadingProducts(false);
    }
  };

  /**
   * Load UTMify config via Edge Function
   * MIGRATED: Uses supabase.functions.invoke instead of supabase.from()
   */
  const loadUTMifyConfig = async () => {
    try {
      setLoadingConfig(true);
      const sessionToken = getProducerSessionToken();
      
      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: {
          action: "vendor-integration",
          integrationType: "UTMIFY",
        },
        headers: { "x-producer-session-token": sessionToken || "" },
      });

      if (error) throw error;

      const integration = data?.integration;
      if (integration) {
        const config = integration.config as { 
          selected_products?: string[]; 
          selected_events?: string[];
          has_token?: boolean;
        } | null;
        
        setUtmifyActive(integration.active || false);
        setSelectedProducts(config?.selected_products || []);
        setSelectedEvents(config?.selected_events || []);
        setHasExistingToken(config?.has_token || false);
        setUtmifyToken("");
      }
    } catch (error: unknown) {
      console.error("Error loading UTMify config:", error);
      toast.error("Erro ao carregar configuração da UTMify");
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!utmifyToken.trim() && !hasExistingToken) {
        toast.error("API Token é obrigatório");
        return;
      }

      const shouldActivate = !hasExistingToken && !utmifyActive && utmifyToken.trim();
      const activeStatus = shouldActivate ? true : utmifyActive;

      const token = getProducerSessionToken();
      if (!token) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const credentials: Record<string, unknown> = {
        selected_products: selectedProducts,
        selected_events: selectedEvents,
        has_token: true,
      };

      if (utmifyToken.trim()) {
        credentials.api_token = utmifyToken.trim();
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/vault-save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Producer-Session-Token": token,
          },
          body: JSON.stringify({
            vendor_id: user?.id,
            integration_type: "UTMIFY",
            credentials,
            active: activeStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar credenciais");
      }

      if (shouldActivate) {
        setUtmifyActive(true);
      }
      
      setHasExistingToken(true);
      setUtmifyToken("");
      
      toast.success("Integração UTMify salva com sucesso!");
    } catch (error: unknown) {
      console.error("Error saving UTMify integration:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao salvar integração UTMify: " + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const getSelectedProductsLabel = () => {
    if (selectedProducts.length === 0) return "Selecione os produtos";
    if (selectedProducts.length === products.length) return "Todos os produtos";
    return `${selectedProducts.length} produto(s) selecionado(s)`;
  };

  const getSelectedEventsLabel = () => {
    if (selectedEvents.length === 0) return "Selecione os eventos";
    if (selectedEvents.length === UTMIFY_EVENTS.length) return "Todos os eventos";
    return `${selectedEvents.length} evento(s) selecionado(s)`;
  };

  if (loadingConfig || loadingProducts) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>UTMify</CardTitle>
          <CardDescription>Rastreamento de conversões com parâmetros UTM</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle>UTMify</CardTitle>
              <CardDescription>Rastreamento de conversões com parâmetros UTM</CardDescription>
            </div>
            <Badge 
              variant={utmifyActive ? "default" : "secondary"} 
              className={utmifyActive ? "bg-success" : "bg-muted"} 
              style={utmifyActive ? {backgroundColor: 'hsl(var(--success))'} : {}}
            >
              {utmifyActive ? "ATIVO" : "INATIVO"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="utmify-active">Ativo</Label>
            <Switch
              id="utmify-active"
              checked={utmifyActive}
              onCheckedChange={setUtmifyActive}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="utmify-token">
            API Token {hasExistingToken && <span className="text-muted-foreground">(já configurado)</span>}
          </Label>
          <Input
            id="utmify-token"
            type="password"
            placeholder={hasExistingToken ? "••••••••••••••••" : "Cole seu token da API da UTMify"}
            value={utmifyToken}
            onChange={(e) => setUtmifyToken(e.target.value)}
          />
          {hasExistingToken && (
            <p className="text-xs text-muted-foreground">
              Token já salvo de forma segura. Deixe em branco para manter o atual ou digite um novo para substituir.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Produtos</Label>
          <Popover open={productsOpen} onOpenChange={setProductsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between">
                {getSelectedProductsLabel()}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar produto..." />
                <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {products.map((product) => (
                    <CommandItem key={product.id} onSelect={() => toggleProduct(product.id)}>
                      <Checkbox checked={selectedProducts.includes(product.id)} className="mr-2" />
                      {product.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          {selectedProducts.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedProducts.map((productId) => {
                const product = products.find(p => p.id === productId);
                return product ? <Badge key={productId} variant="secondary">{product.name}</Badge> : null;
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Eventos</Label>
          <Popover open={eventsOpen} onOpenChange={setEventsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between">
                {getSelectedEventsLabel()}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar evento..." />
                <CommandEmpty>Nenhum evento encontrado.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {UTMIFY_EVENTS.map((event) => (
                    <CommandItem key={event.id} onSelect={() => toggleEvent(event.id)}>
                      <Checkbox checked={selectedEvents.includes(event.id)} className="mr-2" />
                      <div className="flex flex-col">
                        <span>{event.label}</span>
                        <span className="text-xs text-muted-foreground">{event.description}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          {selectedEvents.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedEvents.map((eventId) => {
                const event = UTMIFY_EVENTS.find(e => e.id === eventId);
                return event ? <Badge key={eventId} variant="secondary">{event.label}</Badge> : null;
              })}
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configuração
        </Button>
      </CardContent>
    </Card>
  );
};
