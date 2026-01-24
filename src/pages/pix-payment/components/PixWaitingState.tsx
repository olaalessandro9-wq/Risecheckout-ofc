/**
 * PixWaitingState - Estado de aguardando pagamento PIX
 * 
 * Componente orquestrador que compõe os sub-componentes de UI
 */

import { PixCopyButton } from "./PixCopyButton";
import { PixVerifyButton } from "./PixVerifyButton";
import { PixProgressBar } from "./PixProgressBar";
import { PixQrCodeDisplay } from "./PixQrCodeDisplay";
import { PixInstructions } from "./PixInstructions";

interface PixWaitingStateProps {
  qrCode: string;
  qrCodeImageBase64: string | null;
  timeRemaining: number;
  progressPercentage: number;
  formatTime: (seconds: number) => string;
  onCopy: () => Promise<void>;
  onCheckStatus: () => Promise<{ paid: boolean }>;
  checkingPayment: boolean;
  copied: boolean;
}

export function PixWaitingState({
  qrCode,
  qrCodeImageBase64,
  timeRemaining,
  progressPercentage,
  formatTime,
  onCopy,
  onCheckStatus,
  checkingPayment,
  copied,
}: PixWaitingStateProps) {
  return (
    <>
      <h1 className="text-2xl font-bold text-[hsl(var(--payment-card-text-primary))] mb-6 text-center">
        Aqui está o PIX copia e cola
      </h1>

      <p className="text-[hsl(var(--payment-card-text-secondary))] mb-6 text-center">
        Copie o código ou use a câmera para ler o QR Code e realize o pagamento no app do seu banco.
      </p>

      <PixCopyButton 
        qrCode={qrCode} 
        copied={copied} 
        onCopy={onCopy} 
      />

      <PixVerifyButton 
        checkingPayment={checkingPayment} 
        onCheckStatus={onCheckStatus} 
      />

      <PixProgressBar 
        timeRemaining={timeRemaining} 
        progressPercentage={progressPercentage} 
        formatTime={formatTime} 
      />

      <PixQrCodeDisplay 
        qrCode={qrCode} 
        qrCodeImageBase64={qrCodeImageBase64} 
      />

      <PixInstructions />
    </>
  );
}
