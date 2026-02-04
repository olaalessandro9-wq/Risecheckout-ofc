/**
 * BuyerRecuperarSenha - Recuperação de senha para alunos
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Uses BuyerAuthLayout for unified theme and layout.
 * Uses unified-auth as SSOT.
 * 
 * Estados:
 * 1. form - Formulário para digitar email
 * 2. loading - Processando requisição
 * 3. success - Email enviado com sucesso
 * 4. error - Email não encontrado
 * 
 * @module members-area/pages/buyer
 * @version 4.0.0
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthInput } from "@/components/auth/ui";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import { BuyerAuthLayout } from "@/modules/members-area/components";

const log = createLogger("BuyerRecuperarSenha");

type ViewState = "form" | "loading" | "success" | "error";

interface PasswordResetResponse {
  message?: string;
  error?: string;
}

export default function BuyerRecuperarSenha() {
  const [email, setEmail] = useState("");
  const [viewState, setViewState] = useState<ViewState>("form");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setErrorMessage("Digite seu e-mail");
      return;
    }

    setViewState("loading");
    setErrorMessage("");

    try {
      // RISE V3: Use unified-auth as SSOT
      const { data, error } = await api.publicCall<PasswordResetResponse>(
        "unified-auth/password-reset-request",
        { email: email.trim().toLowerCase() }
      );

      if (error) {
        // unified-auth returns success even for non-existent emails (security)
        // Only network errors are actual errors
        setErrorMessage(error.message || "Erro ao processar solicitação");
        setViewState("form");
        return;
      }

      // Always show success (prevents email enumeration attacks)
      setViewState("success");
    } catch (error: unknown) {
      log.error("Error requesting password reset:", error);
      setErrorMessage("Erro de conexão. Tente novamente.");
      setViewState("form");
    }
  };

  const handleCancel = () => {
    navigate("/minha-conta");
  };

  const handleTryAgain = () => {
    setViewState("form");
    setErrorMessage("");
  };

  // Determine branding based on view
  const brandingTitle = viewState === "success" ? (
    <>
      E-mail enviado <br />
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))]">
        com sucesso
      </span>
    </>
  ) : (
    <>
      Recupere seu acesso <br />
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))]">
        de forma simples
      </span>
    </>
  );

  const brandingDescription = viewState === "success"
    ? "Verifique sua caixa de entrada para continuar."
    : "Não se preocupe, vamos te ajudar a voltar a acessar seus cursos.";

  return (
    <BuyerAuthLayout
      brandingTitle={brandingTitle}
      brandingDescription={brandingDescription}
    >
      <AnimatePresence mode="wait">
        {/* View: Form */}
        {(viewState === "form" || viewState === "loading") && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-[hsl(var(--auth-text-primary))]">Recuperar Senha</h1>
              <p className="text-[hsl(var(--auth-text-muted))]">
                Digite o e-mail vinculado à sua conta no espaço abaixo e em seguida enviaremos um link para redefinir a sua senha.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[hsl(var(--auth-text-primary))]">E-mail</Label>
                <AuthInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={viewState === "loading"}
                  hasError={!!errorMessage && viewState === "form"}
                />
                {errorMessage && viewState === "form" && (
                  <p className="text-sm text-[hsl(var(--auth-error))]">{errorMessage}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={viewState === "loading"}
                className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] hover:opacity-90 hover:scale-[1.02] transition-all text-white font-semibold shadow-lg shadow-[hsl(var(--auth-accent)/0.3)]"
              >
                {viewState === "loading" ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar"
                )}
              </Button>
            </form>

            {/* Cancel Link */}
            <div className="text-center">
              <button
                onClick={handleCancel}
                disabled={viewState === "loading"}
                className="text-sm text-[hsl(var(--auth-text-muted))] hover:text-[hsl(var(--auth-text-primary))] transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}

        {/* View: Success */}
        {viewState === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 text-center"
          >
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-[hsl(var(--auth-success)/0.2)] flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-[hsl(var(--auth-success))]" />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-[hsl(var(--auth-text-primary))]">E-mail enviado!</h1>
              <div className="space-y-2 text-[hsl(var(--auth-text-muted))]">
                <p>Se o email existir em nossa base, você receberá um link para</p>
                <p className="text-[hsl(var(--auth-text-primary))] font-medium">{email}</p>
                <p className="text-sm">Verifique sua caixa de entrada e spam.</p>
              </div>
            </div>

            {/* Action */}
            <Link to="/minha-conta">
              <Button className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] hover:opacity-90 hover:scale-[1.02] transition-all text-white font-semibold shadow-lg shadow-[hsl(var(--auth-accent)/0.3)]">
                Voltar ao login
              </Button>
            </Link>
          </motion.div>
        )}

        {/* View: Error (Email not found) */}
        {viewState === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 text-center"
          >
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-[hsl(var(--auth-error)/0.2)] flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-[hsl(var(--auth-error))]" />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-[hsl(var(--auth-text-primary))]">E-mail não encontrado</h1>
              <div className="space-y-2 text-[hsl(var(--auth-text-muted))]">
                <p>O e-mail informado não está cadastrado em nossa base de dados.</p>
                <p className="text-sm">Verifique se digitou corretamente ou entre em contato com o suporte.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={handleTryAgain}
                className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] hover:opacity-90 hover:scale-[1.02] transition-all text-white font-semibold shadow-lg shadow-[hsl(var(--auth-accent)/0.3)]"
              >
                Tentar novamente
              </Button>
              <button
                onClick={handleCancel}
                className="text-sm text-[hsl(var(--auth-text-muted))] hover:text-[hsl(var(--auth-text-primary))] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BuyerAuthLayout>
  );
}
