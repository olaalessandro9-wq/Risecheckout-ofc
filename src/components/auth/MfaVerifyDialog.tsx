/**
 * MFA Verify Dialog
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Modal that appears after login when MFA is required.
 * Supports both TOTP codes (6 digits) and backup codes.
 * 
 * @module components/auth/MfaVerifyDialog
 * @version 1.0.0
 */

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { mfaVerify } from "@/services/mfaService";

// ============================================================================
// TYPES
// ============================================================================

interface MfaVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mfaSessionToken: string;
  onSuccess: (data: {
    user?: { id: string; email: string; name: string | null };
    roles?: string[];
    activeRole?: string;
    expiresIn?: number;
  }) => void;
  onError: (message: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MfaVerifyDialog({
  open,
  onOpenChange,
  mfaSessionToken,
  onSuccess,
  onError,
}: MfaVerifyDialogProps) {
  const [isBackupMode, setIsBackupMode] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setOtpCode("");
    setBackupCode("");
    setErrorMessage(null);
    setIsVerifying(false);
    setIsBackupMode(false);
  }, []);

  const handleVerify = useCallback(
    async (code: string, isBackup: boolean) => {
      if (!code.trim()) return;

      setIsVerifying(true);
      setErrorMessage(null);

      try {
        const result = await mfaVerify(mfaSessionToken, code.trim(), isBackup);
        resetState();
        onSuccess(result);
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : "Erro na verificação";
        setErrorMessage(msg);
        onError(msg);
      } finally {
        setIsVerifying(false);
      }
    },
    [mfaSessionToken, onSuccess, onError, resetState]
  );

  const handleOtpComplete = useCallback(
    (value: string) => {
      setOtpCode(value);
      if (value.length === 6) {
        handleVerify(value, false);
      }
    },
    [handleVerify]
  );

  const handleBackupSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleVerify(backupCode, true);
    },
    [backupCode, handleVerify]
  );

  const toggleMode = useCallback(() => {
    setIsBackupMode((prev) => !prev);
    setOtpCode("");
    setBackupCode("");
    setErrorMessage(null);
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) resetState();
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <DialogTitle>Verificação em Duas Etapas</DialogTitle>
          </div>
          <DialogDescription>
            {isBackupMode
              ? "Digite um dos seus códigos de backup"
              : "Digite o código de 6 dígitos do seu aplicativo autenticador"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!isBackupMode ? (
            /* TOTP Mode */
            <div className="flex flex-col items-center gap-4">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={handleOtpComplete}
                disabled={isVerifying}
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

              {isVerifying && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando...
                </div>
              )}
            </div>
          ) : (
            /* Backup Code Mode */
            <form onSubmit={handleBackupSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-code" className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Código de Backup
                </Label>
                <Input
                  id="backup-code"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  placeholder="XXXXXXXX"
                  disabled={isVerifying}
                  autoComplete="off"
                  className="font-mono text-center tracking-widest"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isVerifying || !backupCode.trim()}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar"
                )}
              </Button>
            </form>
          )}

          {/* Error Message */}
          {errorMessage && (
            <p className="text-sm text-destructive text-center">
              {errorMessage}
            </p>
          )}

          {/* Toggle Mode Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              disabled={isVerifying}
              className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              {isBackupMode
                ? "Usar código do aplicativo"
                : "Usar código de backup"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
