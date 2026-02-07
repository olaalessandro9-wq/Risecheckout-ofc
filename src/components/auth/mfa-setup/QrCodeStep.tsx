/**
 * MFA Setup - QR Code Step
 * 
 * Displays the TOTP QR code for scanning with an authenticator app.
 * Handles loading, error, and retry states.
 * 
 * @module components/auth/mfa-setup/QrCodeStep
 * @version 1.0.0
 */

import { Button } from "@/components/ui/button";
import { Loader2, QrCode } from "lucide-react";

interface QrCodeStepProps {
  isLoading: boolean;
  qrCodeDataUrl: string | null;
  error: string | null;
  onRetry: () => void;
  onNext: () => void;
}

export function QrCodeStep({
  isLoading,
  qrCodeDataUrl,
  error,
  onRetry,
  onNext,
}: QrCodeStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <QrCode className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Escaneie o QR Code abaixo com seu aplicativo autenticador
          (Google Authenticator, Authy, etc.)
        </p>
      </div>

      <div className="flex justify-center">
        {isLoading ? (
          <div className="flex h-64 w-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : qrCodeDataUrl ? (
          <img
            src={qrCodeDataUrl}
            alt="QR Code para configuração MFA"
            className="h-64 w-64 rounded-lg border bg-white p-2"
          />
        ) : error ? (
          <div className="flex h-64 w-64 flex-col items-center justify-center gap-2">
            <p className="text-sm text-destructive text-center">{error}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Tentar novamente
            </Button>
          </div>
        ) : null}
      </div>

      <Button
        className="w-full"
        onClick={onNext}
        disabled={!qrCodeDataUrl || isLoading}
      >
        Próximo: Confirmar Código
      </Button>
    </div>
  );
}
