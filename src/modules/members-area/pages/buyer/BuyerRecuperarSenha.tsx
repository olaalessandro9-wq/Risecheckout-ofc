/**
 * BuyerRecuperarSenha - Recuperação de senha para alunos
 * 
 * RISE Protocol V3 - Uses unified-auth as SSOT
 * 
 * Estados:
 * 1. form - Formulário para digitar email
 * 2. loading - Processando requisição
 * 3. success - Email enviado com sucesso
 * 4. error - Email não encontrado
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

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

  return (
    <div className="min-h-screen w-full flex bg-[hsl(var(--auth-bg))] text-[hsl(var(--auth-text-primary))] overflow-hidden relative">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(var(--auth-accent)/0.1)] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(var(--auth-purple)/0.1)] blur-[120px]" />
      </div>

      <div className="w-full flex">
        {/* Left Panel - Visual Branding (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[hsl(var(--auth-panel-bg))] backdrop-blur-sm border-r border-[hsl(var(--auth-border))] flex-col justify-between p-12">
          {/* Logo */}
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 w-fit hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-purple))] flex items-center justify-center shadow-lg shadow-[hsl(var(--auth-accent)/0.2)]">
                <span className="font-bold text-white text-xl">R</span>
              </div>
              <span className="font-bold text-xl text-white tracking-tight">RiseCheckout</span>
            </Link>
          </div>

          {/* Feature Highlight */}
          <div className="relative z-10 max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-bold text-white leading-tight">
                Recupere seu acesso <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-purple))]">
                  de forma simples
                </span>
              </h2>
              <p className="text-lg text-[hsl(var(--auth-text-secondary))] leading-relaxed">
                Não se preocupe, vamos te ajudar a voltar a acessar seus cursos.
              </p>
            </motion.div>
          </div>

          {/* Footer Copyright */}
          <div className="relative z-10 text-xs text-[hsl(var(--auth-text-muted))]">
            © 2026 RiseCheckout Inc. Todos os direitos reservados.
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12 relative z-10">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-purple))] flex items-center justify-center">
                  <span className="font-bold text-white">R</span>
                </div>
                <span className="font-bold text-lg text-white">RiseCheckout</span>
              </Link>
            </div>

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
                    <h1 className="text-2xl font-bold text-white">Recuperar Senha</h1>
                    <p className="text-[hsl(var(--auth-text-secondary))]">
                      Digite o e-mail vinculado à sua conta no espaço abaixo e em seguida enviaremos um link para redefinir a sua senha.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[hsl(var(--auth-text-primary))]">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        disabled={viewState === "loading"}
                        className="h-12 bg-[hsl(var(--auth-input-bg))] border-[hsl(var(--auth-border))] text-white placeholder:text-[hsl(var(--auth-text-muted))] focus:border-[hsl(var(--auth-accent)/0.5)] focus:ring-[hsl(var(--auth-accent)/0.2)]"
                      />
                      {errorMessage && viewState === "form" && (
                        <p className="text-sm text-[hsl(var(--auth-error))]">{errorMessage}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={viewState === "loading"}
                      className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-purple))] hover:from-[hsl(var(--auth-accent-hover))] hover:to-[hsl(var(--auth-purple))] text-white font-semibold"
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
                      className="text-sm text-[hsl(var(--auth-text-secondary))] hover:text-white transition-colors disabled:opacity-50"
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
                    <h1 className="text-2xl font-bold text-white">E-mail enviado!</h1>
                    <div className="space-y-2 text-[hsl(var(--auth-text-secondary))]">
                      <p>Se o email existir em nossa base, você receberá um link para</p>
                      <p className="text-white font-medium">{email}</p>
                      <p className="text-sm">Verifique sua caixa de entrada e spam.</p>
                    </div>
                  </div>

                  {/* Action */}
                  <Link to="/minha-conta">
                    <Button className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-purple))] hover:from-[hsl(var(--auth-accent-hover))] hover:to-[hsl(var(--auth-purple))] text-white font-semibold">
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
                    <h1 className="text-2xl font-bold text-white">E-mail não encontrado</h1>
                    <div className="space-y-2 text-[hsl(var(--auth-text-secondary))]">
                      <p>O e-mail informado não está cadastrado em nossa base de dados.</p>
                      <p className="text-sm">Verifique se digitou corretamente ou entre em contato com o suporte.</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button 
                      onClick={handleTryAgain}
                      className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-purple))] hover:from-[hsl(var(--auth-accent-hover))] hover:to-[hsl(var(--auth-purple))] text-white font-semibold"
                    >
                      Tentar novamente
                    </Button>
                    <button
                      onClick={handleCancel}
                      className="text-sm text-[hsl(var(--auth-text-secondary))] hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
