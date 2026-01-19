/**
 * PixPaymentPage - Página de pagamento PIX
 * 
 * Responsabilidade: Orquestrar hooks e renderizar estado apropriado
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";

import { usePixOrderData, usePixCharge, usePixPaymentStatus, usePixTimer } from "./hooks";
import { 
  PixLoadingState, 
  PixPaidState, 
  PixExpiredState, 
  PixWaitingState 
} from "./components";
import type { GatewayType, PixNavigationState } from "./types";

const log = createLogger('PixPaymentPage');

export function PixPaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const navState = location.state as PixNavigationState | null;
  
  const [gateway, setGateway] = useState<GatewayType | null>(null);
  const [copied, setCopied] = useState(false);
  const hasInitialized = useRef(false);

  // Hooks especializados
  const { orderData, fetchOrderData } = usePixOrderData(orderId, navState?.accessToken);
  
  const { 
    qrCode, qrCodeImageBase64, pixId, loading, 
    createCharge, setQrCode, setQrCodeImageBase64 
  } = usePixCharge(orderId, orderData, navState);

  const { timeRemaining, formatTime, progressPercentage, resetTimer, setTimeRemaining } = usePixTimer({
    paymentStatus: "waiting",
    onExpire: () => setPaymentStatus("expired")
  });

  const { 
    paymentStatus, checkingPayment, checkStatus, setPaymentStatus 
  } = usePixPaymentStatus({
    gateway, orderId, pixId, orderData, 
    accessToken: navState?.accessToken, 
    qrCode,
    timeRemaining
  });

  // Inicialização
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    log.debug('Inicializando', { navState, orderId });

    if (navState?.qrCode || navState?.qrCodeText) {
      const gatewayType = navState.gateway || 'mercadopago';
      log.info(`QR Code recebido via navigation state (${gatewayType})`);
      
      if (gatewayType === 'asaas') {
        setQrCode(navState.qrCodeText || '');
        setQrCodeImageBase64(navState.qrCode || null);
      } else if (gatewayType === 'mercadopago') {
        setQrCode(navState.qrCode || '');
        setQrCodeImageBase64(navState.qrCodeBase64 || null);
      } else {
        setQrCode(navState.qrCode || navState.qrCodeText || '');
      }
      
      setGateway(gatewayType);
      setTimeRemaining(900);
      
      toast.success("QR Code gerado com sucesso!");
      fetchOrderData();
    } else {
      log.debug('Sem QR code no state, buscando dados do pedido...');
      setGateway('pushinpay');
      fetchOrderData();
    }
  }, [navState, orderId, fetchOrderData, setQrCode, setQrCodeImageBase64, setTimeRemaining]);

  // Criar cobrança quando orderData estiver disponível e não tiver QR code
  useEffect(() => {
    if (orderData && !qrCode && gateway === 'pushinpay') {
      createCharge();
    }
  }, [orderData, qrCode, gateway, createCharge]);

  // Copiar código PIX
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar código");
    }
  }, [qrCode]);

  // Regenerar QR Code
  const handleRegenerate = useCallback(async () => {
    setPaymentStatus("waiting");
    resetTimer();
    await createCharge();
  }, [createCharge, resetTimer, setPaymentStatus]);

  // Loading
  if (loading && !qrCode) {
    return <PixLoadingState />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Botão Voltar */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white hover:text-gray-300 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar e editar o pedido</span>
        </button>

        {/* Card principal */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {paymentStatus === "paid" ? (
            <PixPaidState />
          ) : paymentStatus === "expired" ? (
            <PixExpiredState onRegenerate={handleRegenerate} />
          ) : (
            <PixWaitingState
              qrCode={qrCode}
              qrCodeImageBase64={qrCodeImageBase64}
              timeRemaining={timeRemaining}
              progressPercentage={progressPercentage}
              formatTime={formatTime}
              onCopy={copyToClipboard}
              onCheckStatus={checkStatus}
              checkingPayment={checkingPayment}
              copied={copied}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PixPaymentPage;
