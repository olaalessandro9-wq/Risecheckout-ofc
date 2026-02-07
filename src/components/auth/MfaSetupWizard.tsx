/**
 * MFA Setup Wizard
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * 3-step wizard for configuring MFA (TOTP) for the first time.
 * Steps: QR Code → Code Verification → Backup Codes
 * 
 * @module components/auth/MfaSetupWizard
 * @version 1.0.0
 */

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Loader2,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  Copy,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { mfaSetup, mfaVerifySetup } from "@/services/mfaService";

// ============================================================================
// TYPES
// ============================================================================

type WizardStep = "qr-code" | "verify" | "backup-codes";

interface MfaSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MfaSetupWizard({
  open,
  onOpenChange,
  onComplete,
}: MfaSetupWizardProps) {
  const [step, setStep] = useState<WizardStep>("qr-code");
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [savedBackupCodes, setSavedBackupCodes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep("qr-code");
      setQrCodeDataUrl(null);
      setOtpCode("");
      setBackupCodes([]);
      setSavedBackupCodes(false);
      setError(null);
      loadQrCode();
    }
  }, [open]);

  const loadQrCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mfaSetup();
      const dataUrl = await QRCode.toDataURL(result.otpauthUri, {
        width: 256,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQrCodeDataUrl(dataUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar QR Code";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleVerifyCode = useCallback(
    async (code: string) => {
      if (code.length !== 6) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await mfaVerifySetup(code);
        setBackupCodes(result.backupCodes);
        setStep("backup-codes");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Código inválido";
        setError(msg);
        setOtpCode("");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleOtpChange = useCallback(
    (value: string) => {
      setOtpCode(value);
      if (value.length === 6) {
        handleVerifyCode(value);
      }
    },
    [handleVerifyCode]
  );

  const handleCopyBackupCodes = useCallback(() => {
    const text = backupCodes.join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Códigos copiados!");
  }, [backupCodes]);

  const handleDownloadBackupCodes = useCallback(() => {
    const text = [
      "RiseCheckout - Códigos de Backup MFA",
      "=====================================",
      "Guarde estes códigos em um lugar seguro.",
      "Cada código só pode ser usado uma vez.",
      "",
      ...backupCodes.map((code, i) => `${i + 1}. ${code}`),
      "",
      `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "risecheckout-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo baixado!");
  }, [backupCodes]);

  const handleComplete = useCallback(() => {
    onOpenChange(false);
    onComplete();
  }, [onOpenChange, onComplete]);

  // Step indicators
  const steps: { key: WizardStep; label: string }[] = [
    { key: "qr-code", label: "QR Code" },
    { key: "verify", label: "Confirmar" },
    { key: "backup-codes", label: "Backup" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <DialogTitle>Configurar Autenticação de Dois Fatores</DialogTitle>
          </div>
          <DialogDescription>
            Adicione uma camada extra de segurança à sua conta
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {steps.map((s, index) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  index <= currentStepIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-xs hidden sm:inline ${
                  index <= currentStepIndex
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`h-px w-8 ${
                    index < currentStepIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="py-4">
          {/* Step 1: QR Code */}
          {step === "qr-code" && (
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
                    <p className="text-sm text-destructive text-center">
                      {error}
                    </p>
                    <Button variant="outline" size="sm" onClick={loadQrCode}>
                      Tentar novamente
                    </Button>
                  </div>
                ) : null}
              </div>

              <Button
                className="w-full"
                onClick={() => setStep("verify")}
                disabled={!qrCodeDataUrl || isLoading}
              >
                Próximo: Confirmar Código
              </Button>
            </div>
          )}

          {/* Step 2: Verify TOTP Code */}
          {step === "verify" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Digite o código de 6 dígitos exibido no seu aplicativo
                  autenticador para confirmar a configuração.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={handleOtpChange}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>

                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando...
                  </div>
                )}

                {error && (
                  <p className="text-sm text-destructive text-center">
                    {error}
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep("qr-code");
                  setOtpCode("");
                  setError(null);
                }}
              >
                Voltar
              </Button>
            </div>
          )}

          {/* Step 3: Backup Codes */}
          {step === "backup-codes" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 mx-auto text-primary" />
                <p className="text-sm font-medium text-foreground">
                  MFA ativado com sucesso!
                </p>
                <p className="text-sm text-muted-foreground">
                  Salve estes códigos de backup em um local seguro. Cada código
                  só pode ser usado uma vez.
                </p>
              </div>

              {/* Backup Codes Grid */}
              <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/50 p-4">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="rounded bg-background px-3 py-2 text-center font-mono text-sm tracking-wider"
                  >
                    {code}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyBackupCodes}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownloadBackupCodes}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>

              {/* Confirmation Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="saved-codes"
                  checked={savedBackupCodes}
                  onCheckedChange={(checked) =>
                    setSavedBackupCodes(checked === true)
                  }
                />
                <label
                  htmlFor="saved-codes"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Salvei meus códigos de backup em um lugar seguro
                </label>
              </div>

              <Button
                className="w-full"
                disabled={!savedBackupCodes}
                onClick={handleComplete}
              >
                Concluir
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
