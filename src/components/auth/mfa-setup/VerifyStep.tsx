/**
 * MFA Setup - Verify Step
 * 
 * TOTP code input with auto-submit on 6 digits.
 * Displays loading spinner during verification and error messages.
 * 
 * @module components/auth/mfa-setup/VerifyStep
 * @version 1.0.0
 */

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2 } from "lucide-react";

interface VerifyStepProps {
  otpCode: string;
  isLoading: boolean;
  error: string | null;
  onOtpChange: (value: string) => void;
  onBack: () => void;
}

export function VerifyStep({
  otpCode,
  isLoading,
  error,
  onOtpChange,
  onBack,
}: VerifyStepProps) {
  return (
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
          onChange={onOtpChange}
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
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
      </div>

      <Button variant="outline" className="w-full" onClick={onBack}>
        Voltar
      </Button>
    </div>
  );
}
