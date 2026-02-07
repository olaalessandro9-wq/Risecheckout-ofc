/**
 * ConfirmarEmail - Processes the email verification link
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Receives the token from query params, calls verify-email endpoint,
 * and displays success or error state.
 */

import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

type VerificationState = "loading" | "success" | "error" | "expired";

export default function ConfirmarEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<VerificationState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    if (!token) {
      setState("error");
      setErrorMessage("Link de verificação inválido. Nenhum token encontrado.");
      return;
    }

    async function verifyToken() {
      try {
        const { data, error } = await api.publicCall<{
          success: boolean;
          alreadyVerified?: boolean;
        }>("unified-auth/verify-email", { token });

        if (error) {
          // Check for expired token (HTTP 410)
          if (error.message?.includes("expirado")) {
            setState("expired");
            setErrorMessage(error.message);
          } else {
            setState("error");
            setErrorMessage(error.message || "Erro ao verificar email");
          }
          return;
        }

        if (data?.success) {
          setState("success");
        } else {
          setState("error");
          setErrorMessage("Erro ao verificar email");
        }
      } catch {
        setState("error");
        setErrorMessage("Erro de conexão. Tente novamente.");
      }
    }

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--auth-bg))] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        {/* Loading */}
        {state === "loading" && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 text-[hsl(var(--auth-accent))] animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-[hsl(var(--auth-text-primary))]">
              Verificando seu email...
            </h1>
            <p className="text-sm text-[hsl(var(--auth-text-muted))]">
              Aguarde um momento.
            </p>
          </div>
        )}

        {/* Success */}
        {state === "success" && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-[hsl(var(--auth-text-primary))]">
                Email confirmado!
              </h1>
              <p className="text-sm text-[hsl(var(--auth-text-muted))]">
                Sua conta foi ativada com sucesso. Faça login para começar.
              </p>
            </div>
            <Link to="/auth">
              <Button className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] hover:opacity-90 text-[hsl(var(--auth-text-primary))] font-semibold rounded-xl">
                Ir para o login
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-[hsl(var(--auth-text-primary))]">
                Erro na verificação
              </h1>
              <p className="text-sm text-[hsl(var(--auth-text-muted))]">
                {errorMessage}
              </p>
            </div>
            <Link to="/auth">
              <Button
                variant="outline"
                className="w-full h-12 border-[hsl(var(--auth-input-border)/0.2)] text-[hsl(var(--auth-text-secondary))] rounded-xl"
              >
                Voltar ao login
              </Button>
            </Link>
          </div>
        )}

        {/* Expired Token */}
        {state === "expired" && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-yellow-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-[hsl(var(--auth-text-primary))]">
                Link expirado
              </h1>
              <p className="text-sm text-[hsl(var(--auth-text-muted))]">
                Este link de verificação expirou. Faça login para solicitar um novo link.
              </p>
            </div>
            <Link to="/auth">
              <Button className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] hover:opacity-90 text-[hsl(var(--auth-text-primary))] font-semibold rounded-xl">
                Ir para o login
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}