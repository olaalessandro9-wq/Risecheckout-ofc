/**
 * useResetPassword Hook
 * 
 * RISE Protocol V3 - Uses unified-auth as SSOT for password reset
 * 
 * Refactored to use api.publicCall for standardized API communication.
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import type { ViewState, PasswordValidation, ResetPasswordConfig } from "@/components/auth/reset-password/types";

const log = createLogger("UseResetPassword");

interface UseResetPasswordReturn {
  viewState: ViewState;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  errorMessage: string;
  passwordValidation: PasswordValidation | null;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  setShowPassword: (value: boolean) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

interface VerifyResponse {
  valid: boolean;
  email?: string;
  error?: string;
}

interface ResetResponse {
  success: boolean;
  error?: string;
  validation?: PasswordValidation;
}

export function useResetPassword(config: ResetPasswordConfig): UseResetPasswordReturn {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [viewState, setViewState] = useState<ViewState>("validating");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation | null>(null);

  // Validate token on mount - uses unified-auth (RISE V3 SSOT)
  useEffect(() => {
    if (!token) {
      setErrorMessage("Link inválido. Token não encontrado.");
      setViewState("invalid");
      return;
    }

    const validateToken = async () => {
      try {
        // Use unified-auth for token verification
        const { data, error } = await api.publicCall<VerifyResponse>(
          "unified-auth/password-reset-verify",
          { token }
        );

        if (error || !data?.valid) {
          setErrorMessage(data?.error || error?.message || "Link inválido ou expirado");
          setViewState("invalid");
          return;
        }

        setEmail(data.email || "");
        setViewState("form");
      } catch (error: unknown) {
        log.error("Error validating token:", error);
        setErrorMessage("Erro ao validar link. Tente novamente.");
        setViewState("invalid");
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setPasswordValidation(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    setViewState("loading");

    try {
      // Use unified-auth for password reset (RISE V3 SSOT)
      const { data, error } = await api.publicCall<ResetResponse>(
        "unified-auth/password-reset",
        { token, password }
      );

      if (error) {
        setErrorMessage(error.message || "Erro ao redefinir senha");
        setViewState("form");
        return;
      }

      if (!data?.success) {
        if (data?.validation) {
          setPasswordValidation(data.validation);
        }
        setErrorMessage(data?.error || "Erro ao redefinir senha");
        setViewState("form");
        return;
      }

      setViewState("success");
    } catch (error: unknown) {
      log.error("Error resetting password:", error);
      setErrorMessage("Erro de conexão. Tente novamente.");
      setViewState("form");
    }
  }, [token, password, confirmPassword]);

  return {
    viewState,
    email,
    password,
    confirmPassword,
    showPassword,
    errorMessage,
    passwordValidation,
    setPassword,
    setConfirmPassword,
    setShowPassword,
    handleSubmit,
  };
}
