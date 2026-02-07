/**
 * OwnerMfaInput - Reusable OTP Input for Owner Step-Up MFA
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Provides a 6-digit OTP input with contextual description
 * explaining that the Owner's TOTP code is required.
 * 
 * This is a controlled component - the parent manages the code state.
 * Does NOT perform any validation - the backend validates the code.
 * 
 * @module components/auth/OwnerMfaInput
 * @version 1.0.0
 */

import { ShieldAlert } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

interface OwnerMfaInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
}

export function OwnerMfaInput({
  value,
  onChange,
  error,
  disabled = false,
}: OwnerMfaInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <p className="text-sm text-muted-foreground">
          Esta operação requer o{" "}
          <strong className="text-foreground">código MFA do Owner</strong>{" "}
          do sistema. Insira o código de 6 dígitos do aplicativo autenticador
          do Owner.
        </p>
      </div>

      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={value}
          onChange={onChange}
          disabled={disabled}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
