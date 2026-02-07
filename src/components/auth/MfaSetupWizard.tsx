/**
 * MFA Setup Wizard
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * 3-step wizard for configuring MFA (TOTP) for the first time.
 * Steps: QR Code → Code Verification → Backup Codes
 * 
 * Sub-components extracted to comply with 300-line limit:
 * - QrCodeStep: QR code display and scanning
 * - VerifyStep: TOTP code input and verification
 * - BackupCodesStep: Backup codes display, copy, download
 * 
 * @module components/auth/MfaSetupWizard
 * @version 2.0.0
 */

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { mfaSetup, mfaVerifySetup } from "@/services/mfaService";
import { QrCodeStep } from "./mfa-setup/QrCodeStep";
import { VerifyStep } from "./mfa-setup/VerifyStep";
import { BackupCodesStep } from "./mfa-setup/BackupCodesStep";

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
// STEP INDICATOR
// ============================================================================

const WIZARD_STEPS: { key: WizardStep; label: string }[] = [
  { key: "qr-code", label: "QR Code" },
  { key: "verify", label: "Confirmar" },
  { key: "backup-codes", label: "Backup" },
];

function StepIndicator({ currentStep }: { currentStep: WizardStep }) {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {WIZARD_STEPS.map((s, index) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
              index <= currentIndex
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {index + 1}
          </div>
          <span
            className={`text-xs hidden sm:inline ${
              index <= currentIndex
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
          >
            {s.label}
          </span>
          {index < WIZARD_STEPS.length - 1 && (
            <div
              className={`h-px w-8 ${
                index < currentIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
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
  }, [open, loadQrCode]);

  const handleVerifyCode = useCallback(async (code: string) => {
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
  }, []);

  const handleOtpChange = useCallback(
    (value: string) => {
      setOtpCode(value);
      if (value.length === 6) {
        handleVerifyCode(value);
      }
    },
    [handleVerifyCode]
  );

  const handleComplete = useCallback(() => {
    onOpenChange(false);
    onComplete();
  }, [onOpenChange, onComplete]);

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

        <StepIndicator currentStep={step} />

        <div className="py-4">
          {step === "qr-code" && (
            <QrCodeStep
              isLoading={isLoading}
              qrCodeDataUrl={qrCodeDataUrl}
              error={error}
              onRetry={loadQrCode}
              onNext={() => setStep("verify")}
            />
          )}

          {step === "verify" && (
            <VerifyStep
              otpCode={otpCode}
              isLoading={isLoading}
              error={error}
              onOtpChange={handleOtpChange}
              onBack={() => {
                setStep("qr-code");
                setOtpCode("");
                setError(null);
              }}
            />
          )}

          {step === "backup-codes" && (
            <BackupCodesStep
              backupCodes={backupCodes}
              savedBackupCodes={savedBackupCodes}
              onSavedChange={setSavedBackupCodes}
              onComplete={handleComplete}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
