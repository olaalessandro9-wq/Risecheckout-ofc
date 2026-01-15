import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { ViewState, PasswordValidation, ResetPasswordConfig } from "@/components/auth/reset-password/types";

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

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setErrorMessage("Link inválido. Token não encontrado.");
      setViewState("invalid");
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`${config.apiEndpoint}/verify-reset-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok || !data.valid) {
          setErrorMessage(data.error || "Link inválido ou expirado");
          setViewState("invalid");
          return;
        }

        setEmail(data.email || "");
        setViewState("form");
      } catch (error: unknown) {
        console.error("Error validating token:", error);
        setErrorMessage("Erro ao validar link. Tente novamente.");
        setViewState("invalid");
      }
    };

    validateToken();
  }, [token, config.apiEndpoint]);

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
      const response = await fetch(`${config.apiEndpoint}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.validation) {
          setPasswordValidation(data.validation);
        }
        setErrorMessage(data.error || "Erro ao redefinir senha");
        setViewState("form");
        return;
      }

      setViewState("success");
    } catch (error: unknown) {
      console.error("Error resetting password:", error);
      setErrorMessage("Erro de conexão. Tente novamente.");
      setViewState("form");
    }
  }, [token, password, confirmPassword, config.apiEndpoint]);

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
