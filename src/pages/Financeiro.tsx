/**
 * Financeiro - Página de configuração de gateways para Vendors
 * 
 * Esta página é exclusiva para Vendors (user/seller).
 * O Owner tem sua própria página: OwnerGateways.tsx
 */

import { useEffect, useState } from "react";
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

  // Listener para OAuth success
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'mercadopago_oauth_success') {
        console.log('[Financeiro] Mercado Pago conectado com sucesso');
        loadAllIntegrations();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadAllIntegrations = async () => {
    try {
      // Carregar PushinPay
      const settings = await getPushinPaySettings();
      if (settings) {
        if (settings.pushinpay_token === "••••••••") {
          setHasExistingToken(true);
          setApiToken("");
        } else {
          setApiToken(settings.pushinpay_token ?? "");
        }
        setEnvironment(settings.environment ?? "sandbox");
      }

      if (!user?.id) {
        console.warn('[Financeiro] User ID ainda não disponível');
        setMercadoPagoConnected(false);
        return;
      }

      // Carregar Mercado Pago, Stripe e Asaas em paralelo
      const [mpResult, stripeResult, asaasResult] = await Promise.all([
        supabase
          .from('vendor_integrations')
          .select('*')
          .eq('vendor_id', user.id)
          .eq('integration_type', 'MERCADOPAGO')
          .eq('active', true)
          .maybeSingle(),
        supabase
          .from('vendor_integrations')
          .select('*')
          .eq('vendor_id', user.id)
          .eq('integration_type', 'STRIPE')
          .eq('active', true)
          .maybeSingle(),
        supabase
          .from('vendor_integrations')
          .select('*')
          .eq('vendor_id', user.id)
          .eq('integration_type', 'ASAAS')
          .eq('active', true)
          .maybeSingle(),
      ]);

      setMercadoPagoConnected(!!mpResult.data);
      setStripeConnected(!!stripeResult.data);
      setAsaasConnected(!!asaasResult.data);
    } catch (error) {
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
      const result = await savePushinPaySettings({
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
    } catch (error: any) {
      setMessage({ type: "error", text: `Erro: ${error.message}` });
      toast.error(`Erro: ${error.message}`);
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
        return <Asaas.ConfigForm onConnectionChange={() => loadAllIntegrations()} />;
      case "pushinpay":
        return <PushinPay.ConfigForm />;
      case "mercadopago":
        return (
          <MercadoPago.ConfigForm 
            onConnectionChange={() => {
              console.log('[Financeiro] MP status mudou, recarregando...');
              loadAllIntegrations();
            }}
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
