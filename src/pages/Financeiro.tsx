/**
 * Financeiro - Página de configuração de gateways para Vendors
 * 
 * Esta página é exclusiva para Vendors (user/seller).
 * O Owner tem sua própria página: OwnerGateways.tsx
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Wallet, CreditCard } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import * as PushinPay from "@/integrations/gateways/pushinpay";
import * as MercadoPago from "@/integrations/gateways/mercadopago";
import * as Stripe from "@/integrations/gateways/stripe";
import * as Asaas from "@/integrations/gateways/asaas";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PaymentCard } from "@/components/financeiro/PaymentCard";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PushinPayEnvironment } from "@/integrations/gateways/pushinpay/types";
import { getPushinPaySettings, savePushinPaySettings } from "@/integrations/gateways/pushinpay/api";

type PaymentGateway = "pushinpay" | "mercadopago" | "stripe" | "asaas" | null;

export default function Financeiro() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados para vendors
  const [apiToken, setApiToken] = useState("");
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [environment, setEnvironment] = useState<PushinPayEnvironment>("sandbox");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>(null);
  const [mercadoPagoConnected, setMercadoPagoConnected] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [asaasConnected, setAsaasConnected] = useState(false);

  // Carregar dados quando user estiver disponível
  useEffect(() => {
    if (user?.id) {
      loadAllIntegrations();
    }
  }, [user?.id]);

  // Refs para debounce - evita processar mensagens duplicadas e múltiplas chamadas
  const lastOAuthProcessed = useRef<number>(0);
  const lastLoadAllIntegrations = useRef<number>(0);

  // Versão debounced de loadAllIntegrations - evita múltiplas chamadas em sequência
  const loadAllIntegrationsDebounced = useCallback(async () => {
    const now = Date.now();
    if (now - lastLoadAllIntegrations.current < 2000) {
      console.log('[Financeiro] loadAllIntegrations ignorado (debounce 2s)');
      return;
    }
    lastLoadAllIntegrations.current = now;
    await loadAllIntegrations();
  }, [user?.id]);

  // Listener GLOBAL para OAuth success (independente do Sheet estar aberto)
  // Isso garante que mesmo se o Sheet estiver fechado, a UI será atualizada
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const messageType = event.data?.type;
      
      // Aceitar mensagens de OAuth success de qualquer gateway
      const isOAuthSuccess = 
        messageType === 'mercadopago_oauth_success' ||
        messageType === 'stripe_oauth_success' ||
        messageType === 'asaas_oauth_success' ||
        messageType === 'oauth_success';
      
      if (isOAuthSuccess) {
        // DEBOUNCE: ignorar mensagens duplicadas dentro de 5 segundos
        const now = Date.now();
        if (now - lastOAuthProcessed.current < 5000) {
          console.log('[Financeiro] Mensagem duplicada ignorada (debounce):', {
            type: messageType,
            timeSinceLastProcessed: now - lastOAuthProcessed.current
          });
          return;
        }
        lastOAuthProcessed.current = now;
        
        console.log('[Financeiro] OAuth success recebido via postMessage:', {
          type: messageType,
          origin: event.origin,
          attempt: event.data?.attempt
        });
        
        // Delay para garantir que o banco foi atualizado antes de recarregar
        setTimeout(() => {
          console.log('[Financeiro] Recarregando integrações (debounced)...');
          loadAllIntegrationsDebounced();
        }, 800);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    console.log('[Financeiro] Listener global de OAuth registrado');
    
    return () => {
      window.removeEventListener('message', handleOAuthMessage);
      console.log('[Financeiro] Listener global de OAuth removido');
    };
  }, [loadAllIntegrationsDebounced]);

  const loadAllIntegrations = async () => {
    if (!user?.id) return;
    try {
      // Carregar PushinPay (ainda via settings direto - será migrado depois)
      const settings = await getPushinPaySettings(user.id);
      if (settings) {
        if (settings.pushinpay_token === "••••••••") {
          setHasExistingToken(true);
          setApiToken("");
        } else {
          setApiToken(settings.pushinpay_token ?? "");
        }
        setEnvironment(settings.environment ?? "sandbox");
      }

      // Carregar todos os gateways via Edge Function (RISE Protocol - single source of truth)
      const { getProducerSessionToken } = await import('@/hooks/useProducerAuth');
      const sessionToken = getProducerSessionToken();

      interface IntegrationStatusResponse {
        success: boolean;
        integrations?: Array<{
          integration_type: string;
          active: boolean;
        }>;
        error?: string;
      }

      const { data: result, error } = await supabase.functions.invoke<IntegrationStatusResponse>('integration-management', {
        body: {
          action: 'status',
          // Sem integrationType = retorna todas
        },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });

      if (error) {
        console.error('[Financeiro] Erro ao buscar status de integrações:', error);
        // Fallback: manter estados anteriores
        return;
      }

      if (result?.success && result.integrations) {
        // Mapear integrações para flags de conexão
        const integrations = result.integrations;
        
        setMercadoPagoConnected(integrations.some(i => i.integration_type === 'MERCADOPAGO' && i.active));
        setStripeConnected(integrations.some(i => i.integration_type === 'STRIPE' && i.active));
        setAsaasConnected(integrations.some(i => i.integration_type === 'ASAAS' && i.active));
        
        console.log('[Financeiro] Status de integrações carregado via Edge Function:', {
          mercadoPago: integrations.some(i => i.integration_type === 'MERCADOPAGO' && i.active),
          stripe: integrations.some(i => i.integration_type === 'STRIPE' && i.active),
          asaas: integrations.some(i => i.integration_type === 'ASAAS' && i.active),
        });
      } else {
        // Nenhuma integração encontrada
        setMercadoPagoConnected(false);
        setStripeConnected(false);
        setAsaasConnected(false);
      }
    } catch (error: unknown) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // Abrir modal automaticamente se vier com query param
  useEffect(() => {
    if (!loadingData) {
      const gatewayParam = searchParams.get("gateway");
      const validGateways = ["pushinpay", "mercadopago", "stripe", "asaas"];
      
      if (gatewayParam && validGateways.includes(gatewayParam)) {
        setSelectedGateway(gatewayParam as PaymentGateway);
        // Limpar param da URL para não reabrir
        setSearchParams({}, { replace: true });
      }
    }
  }, [loadingData, searchParams, setSearchParams]);

  // Auto-hide da mensagem de sucesso
  useEffect(() => {
    if (message?.type === "success") {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function onSave() {
    if (!hasExistingToken && !apiToken.trim()) {
      setMessage({ type: "error", text: "Por favor, informe o API Token" });
      return;
    }

    if (hasExistingToken && !apiToken.trim()) {
      setMessage({ type: "error", text: "Para atualizar, informe um novo token" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await savePushinPaySettings(user!.id, {
        pushinpay_token: apiToken,
        environment,
      });

      if (result.ok) {
        setMessage({ type: "success", text: "Integração PushinPay salva!" });
        toast.success("Integração PushinPay salva!");
        setHasExistingToken(true);
        setApiToken("");
      } else {
        setMessage({ type: "error", text: `Erro: ${result.error}` });
        toast.error(`Erro: ${result.error}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      setMessage({ type: "error", text: `Erro: ${message}` });
      toast.error(`Erro: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  // Configuração dos gateways
  const gatewayConfig = [
    {
      id: "asaas" as const,
      name: "Asaas",
      description: "PIX e Cartão de Crédito",
      icon: CreditCard,
      iconColor: "#00B4D8",
      connected: asaasConnected,
    },
    {
      id: "pushinpay" as const,
      name: "PushinPay",
      description: "Gateway de pagamento PIX",
      icon: Wallet,
      iconColor: "#3b82f6",
      connected: hasExistingToken,
    },
    {
      id: "mercadopago" as const,
      name: "Mercado Pago",
      description: "PIX e Cartão de Crédito",
      icon: CreditCard,
      iconColor: "#009EE3",
      connected: mercadoPagoConnected,
    },
    {
      id: "stripe" as const,
      name: "Stripe",
      description: "Cartão de Crédito e PIX",
      icon: CreditCard,
      iconColor: "#635BFF",
      connected: stripeConnected,
    },
  ];

  const getGatewayTitle = () => gatewayConfig.find(g => g.id === selectedGateway)?.name || "";
  const getGatewayDescription = () => gatewayConfig.find(g => g.id === selectedGateway)?.description || "";

  const renderGatewayContent = () => {
    switch (selectedGateway) {
      case "asaas":
        return <Asaas.ConfigForm onConnectionChange={loadAllIntegrationsDebounced} />;
      case "pushinpay":
        return <PushinPay.ConfigForm />;
      case "mercadopago":
        return (
          <MercadoPago.ConfigForm 
            onConnectionChange={loadAllIntegrationsDebounced}
          />
        );
      case "stripe":
        return <Stripe.ConfigForm />;
      default:
        return null;
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1 text-foreground">
          Financeiro
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure suas integrações de pagamento
        </p>
      </div>

      {/* Lista de Gateways */}
      <div className="max-w-3xl space-y-3">
        {gatewayConfig.map((gateway) => (
          <PaymentCard
            key={gateway.id}
            name={gateway.name}
            description={gateway.description}
            icon={gateway.icon}
            iconColor={gateway.iconColor}
            connected={gateway.connected}
            onClick={() => setSelectedGateway(gateway.id)}
          />
        ))}
      </div>

      {/* Sheet lateral para configuração */}
      <Sheet 
        open={selectedGateway !== null} 
        onOpenChange={(open) => !open && setSelectedGateway(null)}
      >
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{getGatewayTitle()}</SheetTitle>
            <SheetDescription>{getGatewayDescription()}</SheetDescription>
          </SheetHeader>
          {renderGatewayContent()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
