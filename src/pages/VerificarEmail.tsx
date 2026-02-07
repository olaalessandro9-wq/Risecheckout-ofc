/**
 * VerificarEmail - Post-registration email verification notice
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Displayed after successful registration when email verification is required.
 * Shows masked email, resend button with cooldown, and login link.
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Mail, RefreshCw, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { AuthThemeProvider } from "@/components/theme-providers";

/** Cooldown duration in seconds */
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Masks an email for display: jo***@gmail.com
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  
  return `${local.slice(0, 2)}***@${domain}`;
}

export default function VerificarEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || resending || !email) return;

    setResending(true);
    try {
      const { data, error } = await api.publicCall<{ success: boolean }>(
        "unified-auth/resend-verification",
        { email }
      );

      if (error) {
        toast.error(error.message || "Erro ao reenviar email");
      } else if (data?.success) {
        toast.success("Email de verificação reenviado!");
        setCooldown(RESEND_COOLDOWN_SECONDS);
      }
    } catch {
      toast.error("Erro ao reenviar email");
    } finally {
      setResending(false);
    }
  }, [cooldown, resending, email]);

  const maskedEmail = email ? maskEmail(email) : "seu email";

  return (
    <AuthThemeProvider>
      <div className="flex items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8 text-center"
        >
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-[hsl(var(--auth-accent)/0.1)] flex items-center justify-center">
              <Mail className="w-10 h-10 text-[hsl(var(--auth-accent))]" />
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-[hsl(var(--auth-text-primary))]">
              Verifique seu email
            </h1>
            <p className="text-[hsl(var(--auth-text-muted))] text-sm leading-relaxed">
              Enviamos um link de confirmação para{" "}
              <span className="font-medium text-[hsl(var(--auth-text-secondary))]">
                {maskedEmail}
              </span>
              . Clique no link para ativar sua conta.
            </p>
          </div>

          {/* Info card */}
          <div className="bg-[hsl(var(--auth-input-bg)/0.05)] border border-[hsl(var(--auth-input-border)/0.1)] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-[hsl(var(--auth-text-secondary))]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs text-left">Verifique sua caixa de entrada e pasta de spam</p>
            </div>
            <div className="flex items-center gap-2 text-[hsl(var(--auth-text-secondary))]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs text-left">O link expira em 24 horas</p>
            </div>
          </div>

          {/* Resend button */}
          <Button
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            variant="outline"
            className="w-full h-12 border-[hsl(var(--auth-input-border)/0.2)] text-[hsl(var(--auth-text-secondary))] hover:bg-[hsl(var(--auth-input-bg)/0.05)] rounded-xl"
          >
            {resending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Reenviando...
              </>
            ) : cooldown > 0 ? (
              `Reenviar em ${cooldown}s`
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reenviar email de verificação
              </>
            )}
          </Button>

          {/* Back to login */}
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-sm text-[hsl(var(--auth-text-muted))] hover:text-[hsl(var(--auth-text-primary))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao login
          </Link>
        </motion.div>
      </div>
    </AuthThemeProvider>
  );
}