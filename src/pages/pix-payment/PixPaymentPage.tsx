/**
 * PixPaymentPage - Página de pagamento PIX (Refatorada RISE V3)
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Esta página é uma VIEW que:
 * 1. Usa usePixRecovery para recuperação resiliente
 * 2. Exibe QR code do navState OU do banco
 * 3. Faz polling de status
 * 4. NÃO gera QR code - isso é feito no XState actor
 * 
 * @module pix-payment
 */

import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";

import { 
  usePixRecovery,
  usePixOrderData, 
  usePixPaymentStatus, 
  usePixTimer,
} from "./hooks";
import { 
  PixLoadingState, 
  PixPaidState, 
  PixExpiredState, 
  PixWaitingState,
  PixErrorState,
} from "./components";
import type { PixNavigationData } from "@/types/checkout-payment.types";

const log = createLogger('PixPaymentPage');

export function PixPaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Cast navState to PixNavigationData
  const navState = location.state as PixNavigationData | null;
  
  // State
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);

  // RISE V3: Hook de recuperação resiliente
  const { 
    recoveryStatus, 
    recoveredData, 
    accessToken,
    checkoutSlug,
    errorMessage,
    attemptRecovery,
  } = usePixRecovery(orderId, navState);

  // Timer
  const { timeRemaining, formatTime, progressPercentage, resetTimer, setTimeRemaining } = usePixTimer({
    paymentStatus: "waiting",
    onExpire: () => setPaymentStatus("expired")
  });

  // Order data (para polling de status)
  const { orderData, fetchOrderData } = usePixOrderData(orderId, accessToken ?? undefined);

  // Gateway inferido
  const gateway = navState?.gateway ?? 'pushinpay';

  // Status do pagamento
  const { 
    paymentStatus, checkingPayment, checkStatus, setPaymentStatus 
  } = usePixPaymentStatus({
    gateway, 
    orderId, 
    pixId: undefined, 
    orderData, 
    accessToken: accessToken ?? undefined, 
    qrCode,
    timeRemaining
  });

  // Quando recuperar dados, aplicar ao estado local
  useEffect(() => {
    if (recoveredData) {
      log.info("Aplicando dados recuperados", { source: recoveredData.source });
      
      setQrCode(recoveredData.qrCode);
      if (recoveredData.qrCodeBase64) {
        setQrCodeBase64(recoveredData.qrCodeBase64);
      }
      
      // Iniciar timer
      setTimeRemaining(900);
      
      // Buscar dados do pedido para polling
      if (accessToken) {
        fetchOrderData();
      }
      
      toast.success("QR Code PIX pronto!");
    }
  }, [recoveredData, accessToken, fetchOrderData, setTimeRemaining]);

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

  // Voltar ao checkout
  const handleBack = useCallback(() => {
    if (checkoutSlug) {
      navigate(`/pay/${checkoutSlug}`);
    } else {
      navigate('/');
    }
  }, [checkoutSlug, navigate]);

  // Regenerar (apenas se tiver accessToken)
  const handleRegenerate = useCallback(async () => {
    setPaymentStatus("waiting");
    resetTimer();
    // Tentar recuperar novamente (vai pegar do banco se existir)
    await attemptRecovery();
  }, [attemptRecovery, resetTimer, setPaymentStatus]);

// === RENDER ===

  // Estado de carregamento
  if (recoveryStatus === 'idle' || recoveryStatus === 'checking') {
    return <PixLoadingState />;
  }

  // Estado de erro
  if (recoveryStatus === 'error') {
    return (
      <div className="min-h-screen bg-[hsl(var(--payment-bg))] flex items-center justify-center">
        <div className="bg-[hsl(var(--payment-card-bg))] rounded-lg shadow-xl p-8 max-w-md mx-4">
          <PixErrorState 
            message={errorMessage ?? "Não foi possível recuperar os dados do pagamento."}
            actionLabel="Voltar ao checkout"
            onAction={handleBack}
          />
        </div>
      </div>
    );
  }

  // Estado de aguardando regeneração (tem token mas não tem PIX)
  if (recoveryStatus === 'needs_regeneration') {
    return (
      <div className="min-h-screen bg-[hsl(var(--payment-bg))] flex items-center justify-center">
        <div className="bg-[hsl(var(--payment-card-bg))] rounded-lg shadow-xl p-8 max-w-md mx-4">
          <PixErrorState 
            message="O QR Code PIX precisa ser regenerado."
            showRetry
            onRetry={attemptRecovery}
            actionLabel="Voltar ao checkout"
            onAction={handleBack}
          />
        </div>
      </div>
    );
  }

  // Página principal (recovered_from_state ou recovered_from_db)
  return (
    <div className="min-h-screen bg-[hsl(var(--payment-bg))]">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Botão Voltar */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-[hsl(var(--payment-text-primary))] hover:text-[hsl(var(--payment-text-secondary))] mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar e editar o pedido</span>
        </button>

        {/* Card principal */}
        <div className="bg-[hsl(var(--payment-card-bg))] rounded-lg shadow-xl p-8">
          {paymentStatus === "paid" ? (
            <PixPaidState />
          ) : paymentStatus === "expired" ? (
            <PixExpiredState onRegenerate={handleRegenerate} />
          ) : (
            <PixWaitingState
              qrCode={qrCode}
              qrCodeImageBase64={qrCodeBase64}
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
