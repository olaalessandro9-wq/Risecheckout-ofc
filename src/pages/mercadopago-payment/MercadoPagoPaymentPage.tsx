/**
 * MercadoPagoPaymentPage - Página de Pagamento PIX via MercadoPago
 * 
 * RISE Protocol V3 Compliant - Design Tokens
 * Todas as cores usam o sistema --payment-*
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as PushinPay from "@/integrations/gateways/pushinpay";

import {
  useMercadoPagoOrderData,
  useMercadoPagoCharge,
  useMercadoPagoPaymentStatus,
  useMercadoPagoTimer
} from "./hooks";
import type { PaymentNavigationState, PaymentStatus } from "./types";

export function MercadoPagoPaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const navState = location.state as PaymentNavigationState | null;
  const accessToken = navState?.accessToken;

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("loading");
  const [copied, setCopied] = useState(false);

  // Hook: Buscar dados do pedido
  const { orderData, loading: orderLoading, fetchOrderData } = useMercadoPagoOrderData({
    orderId,
    accessToken
  });

  // Hook: Criar pagamento
  const { 
    qrCode, 
    qrCodeBase64, 
    loading: chargeLoading, 
    expiresAt,
    createPayment 
  } = useMercadoPagoCharge({ orderId });

  // Hook: Verificar status do pagamento
  const { checkingPayment, checkPaymentStatus } = useMercadoPagoPaymentStatus({
    orderId,
    accessToken,
    currentStatus: paymentStatus
  });

  // Callback para expiração
  const handleExpire = useCallback(() => {
    setPaymentStatus("expired");
  }, []);

  // Hook: Timer de expiração
  const { timeRemaining, formatTime } = useMercadoPagoTimer({
    expiresAt,
    currentStatus: paymentStatus,
    hasQrCode: !!qrCode,
    onExpire: handleExpire
  });

  // Buscar dados ao montar
  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  // Criar pagamento quando orderData estiver disponível
  useEffect(() => {
    if (orderData && !qrCode) {
      createPayment(orderData).then((result) => {
        if (result.success) {
          setPaymentStatus("waiting");
        } else {
          setPaymentStatus("error");
        }
      });
    }
  }, [orderData, qrCode, createPayment]);

  // Copiar código PIX
  const handleCopyCode = useCallback(() => {
    if (qrCode) {
      navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  }, [qrCode]);

  // Verificar pagamento manualmente
  const handleCheckPayment = useCallback(async () => {
    const result = await checkPaymentStatus();
    if (result.paid) {
      setPaymentStatus("paid");
    }
  }, [checkPaymentStatus]);

  // Estado de loading
  if (orderLoading || chargeLoading || paymentStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--payment-bg))]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--auth-accent))] mx-auto mb-4"></div>
          <p className="text-[hsl(var(--payment-text-primary))]">Gerando QR Code...</p>
        </div>
      </div>
    );
  }

  // Estado de erro (sem QR Code)
  if (!qrCode && paymentStatus === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--payment-bg))] p-4">
        <div className="bg-[hsl(var(--payment-card-bg))] rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[hsl(var(--payment-text-dark))] mb-2">
            Erro ao gerar QR Code
          </h2>
          <p className="text-[hsl(var(--payment-text-secondary))] mb-6">
            Não foi possível gerar o QR Code. Por favor, tente novamente.
          </p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--payment-bg))] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 text-[hsl(var(--payment-text-primary))]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Card Principal */}
        <div className="bg-[hsl(var(--payment-card-bg))] rounded-2xl shadow-xl overflow-hidden">
          {/* Status Header */}
          {paymentStatus === "paid" && (
            <div className="bg-[hsl(var(--payment-success))] text-[hsl(var(--payment-text-primary))] p-4 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
              <p className="font-semibold">Pagamento Confirmado!</p>
              <p className="text-sm opacity-90">Redirecionando...</p>
            </div>
          )}

          {paymentStatus === "expired" && (
            <div className="bg-red-500 text-[hsl(var(--payment-text-primary))] p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p className="font-semibold">QR Code Expirado</p>
              <p className="text-sm opacity-90">Gere um novo para continuar</p>
            </div>
          )}

          {paymentStatus === "waiting" && (
            <div className="bg-[hsl(var(--auth-accent))] text-[hsl(var(--payment-text-primary))] p-4 text-center">
              <Clock className="w-6 h-6 inline-block mr-2" />
              <span className="font-semibold">Aguardando Pagamento</span>
              <span className="ml-4 font-mono">{formatTime(timeRemaining)}</span>
            </div>
          )}

          {/* Conteúdo */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[hsl(var(--payment-text-dark))] mb-2">
                Pague com PIX
              </h1>
              <p className="text-[hsl(var(--payment-text-secondary))]">
                Escaneie o QR Code ou copie o código
              </p>
              {orderData && (
                <p className="text-2xl font-bold text-[hsl(var(--auth-accent))] mt-4">
                  R$ {(orderData.amount_cents / 100).toFixed(2).replace('.', ',')}
                </p>
              )}
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-8">
              <div className="bg-[hsl(var(--payment-card-bg))] p-4 rounded-xl shadow-lg border border-[hsl(var(--payment-border))]">
                {qrCodeBase64 ? (
                  <img 
                    src={`data:image/png;base64,${qrCodeBase64}`} 
                    alt="QR Code PIX" 
                    className="w-64 h-64"
                  />
                ) : (
                  <PushinPay.QRCanvas value={qrCode} size={256} />
                )}
              </div>
            </div>

            {/* Código PIX */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--payment-text-secondary))] mb-2">
                  Código PIX Copia e Cola
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={qrCode}
                    readOnly
                    className="w-full px-4 py-3 pr-12 border border-[hsl(var(--payment-border))] rounded-lg bg-[hsl(var(--payment-card-elevated))] text-[hsl(var(--payment-text-dark))] font-mono text-sm"
                  />
                  <button
                    onClick={handleCopyCode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-[hsl(var(--payment-border))] rounded-lg transition-colors"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-5 h-5 text-[hsl(var(--payment-success))]" />
                    ) : (
                      <Copy className="w-5 h-5 text-[hsl(var(--payment-text-secondary))]" />
                    )}
                  </button>
                </div>
              </div>

              <Button onClick={handleCopyCode} className="w-full" size="lg">
                {copied ? "Código Copiado!" : "Copiar Código PIX"}
              </Button>

              <Button 
                onClick={handleCheckPayment} 
                variant="outline" 
                className="w-full"
                disabled={checkingPayment}
              >
                {checkingPayment ? "Verificando..." : "Verificar Pagamento"}
              </Button>
            </div>

            {/* Instruções */}
            <div className="mt-8 p-4 bg-[hsl(var(--auth-accent)/0.1)] rounded-lg">
              <h3 className="font-semibold text-[hsl(var(--payment-text-dark))] mb-2">Como pagar:</h3>
              <ol className="text-sm text-[hsl(var(--payment-text-secondary))] space-y-2">
                <li>1. Abra o app do seu banco</li>
                <li>2. Escolha pagar com PIX</li>
                <li>3. Escaneie o QR Code ou cole o código</li>
                <li>4. Confirme o pagamento</li>
                <li>5. Pronto! Você receberá o acesso por e-mail</li>
              </ol>
            </div>

            {/* Informações do Pedido */}
            {orderData && (
              <div className="mt-6 pt-6 border-t border-[hsl(var(--payment-border))]">
                <div className="flex justify-between text-sm">
                  <span className="text-[hsl(var(--payment-text-secondary))]">Pedido:</span>
                  <span className="font-mono text-[hsl(var(--payment-text-dark))]">
                    #{orderId?.slice(0, 8)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-[hsl(var(--payment-text-secondary))]">Cliente:</span>
                  <span className="text-[hsl(var(--payment-text-dark))]">{orderData.customer_name}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-[hsl(var(--payment-text-secondary))]">
          <p>Pagamento processado via Mercado Pago</p>
          <p className="mt-1">Ambiente seguro e protegido</p>
        </div>
      </div>
    </div>
  );
}
