/**
 * RecuperarSenha - Password recovery page for producers
 * 
 * @version 2.0.0 - Migrated to Design Tokens (RISE Protocol V3)
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
import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { AuthThemeProvider } from "@/components/theme-providers";

type ViewState = "form" | "loading" | "success" | "error";

export default function RecuperarSenha() {
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
      // Use unified-auth password reset (RISE V3 - SSOT)
      const { data, error } = await api.publicCall<{ success: boolean; message?: string; error?: string }>(
        "unified-auth/password-reset-request",
        { email: email.trim().toLowerCase() }
      );

      if (error) {
        setErrorMessage(error.message || "Erro ao processar solicitação");
        setViewState("form");
        return;
      }

      if (!data?.success) {
        if (data?.error?.includes("não encontrado") || data?.error?.includes("not found")) {
          setErrorMessage("E-mail não encontrado na base de dados");
          setViewState("error");
        } else {
          setErrorMessage(data?.error || "Erro ao processar solicitação");
          setViewState("form");
        }
        return;
      }

      setViewState("success");
    } catch {
      setErrorMessage("Erro de conexão");
      setViewState("form");
    }
  };

  const handleCancel = () => {
    navigate("/auth");
  };

  const handleTryAgain = () => {
    setViewState("form");
    setErrorMessage("");
  };

  return (
    <AuthThemeProvider>
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(var(--auth-accent)/0.1)] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(var(--auth-accent-secondary)/0.1)] blur-[120px]" />
      </div>

      <div className="w-full flex min-h-screen">
        {/* Left Panel - Visual Branding (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[hsl(var(--auth-bg-elevated)/0.05)] backdrop-blur-sm border-r border-[hsl(var(--auth-border)/0.05)] flex-col justify-between p-12">
          {/* Logo */}
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 w-fit hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] flex items-center justify-center shadow-lg shadow-[hsl(var(--auth-accent)/0.2)]">
                <span className="font-bold text-[hsl(var(--auth-text-primary))] text-xl">R</span>
              </div>
              <span className="font-bold text-xl text-[hsl(var(--auth-text-primary))] tracking-tight">RiseCheckout</span>
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
              <h2 className="text-4xl font-bold text-[hsl(var(--auth-text-primary))] leading-tight">
                Recupere seu acesso <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))]">
                  de forma simples
                </span>
              </h2>
              <p className="text-lg text-[hsl(var(--auth-text-muted))] leading-relaxed">
                Não se preocupe, vamos te ajudar a voltar a gerenciar suas vendas.
              </p>
            </motion.div>
          </div>

          {/* Footer Copyright */}
          <div className="relative z-10 text-xs text-[hsl(var(--auth-text-subtle))]">
            © 2026 RiseCheckout Inc. Todos os direitos reservados.
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12 relative z-10">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] flex items-center justify-center">
                  <span className="font-bold text-[hsl(var(--auth-text-primary))]">R</span>
                </div>
                <span className="font-bold text-lg text-[hsl(var(--auth-text-primary))]">RiseCheckout</span>
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
                    <h1 className="text-2xl font-bold text-[hsl(var(--auth-text-primary))]">Recuperar Senha</h1>
                    <p className="text-[hsl(var(--auth-text-muted))]">
                      Digite o e-mail vinculado à sua conta no espaço abaixo e em seguida enviaremos um link para redefinir a sua senha.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[hsl(var(--auth-text-secondary))]">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        disabled={viewState === "loading"}
                        className="h-12 bg-[hsl(var(--auth-input-bg)/0.05)] border-[hsl(var(--auth-input-border)/0.1)] text-[hsl(var(--auth-text-primary))] placeholder:text-[hsl(var(--auth-text-subtle))] focus:border-[hsl(var(--auth-accent)/0.5)] focus:ring-[hsl(var(--auth-accent)/0.2)]"
                      />
                      {errorMessage && viewState === "form" && (
                        <p className="text-sm text-red-400">{errorMessage}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={viewState === "loading"}
                      className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] hover:from-[hsl(var(--auth-accent))] hover:to-[hsl(var(--auth-accent-secondary))] hover:opacity-90 text-[hsl(var(--auth-text-primary))] font-semibold"
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
                      className="text-sm text-[hsl(var(--auth-text-muted))] hover:text-[hsl(var(--auth-text-primary))] transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar ao login
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
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-green-400" />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-4">
                    <h1 className="text-2xl font-bold text-[hsl(var(--auth-text-primary))]">E-mail enviado!</h1>
                    <div className="space-y-2 text-[hsl(var(--auth-text-muted))]">
                      <p>Enviamos um link de recuperação para</p>
                      <p className="text-[hsl(var(--auth-text-primary))] font-medium">{email}</p>
                      <p className="text-sm">Verifique sua caixa de entrada e spam.</p>
                    </div>
                  </div>

                  {/* Action */}
                  <Link to="/auth">
                    <Button className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] hover:opacity-90 text-[hsl(var(--auth-text-primary))] font-semibold">
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
                    <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-10 h-10 text-red-400" />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-4">
                    <h1 className="text-2xl font-bold text-[hsl(var(--auth-text-primary))]">E-mail não encontrado</h1>
                    <div className="space-y-2 text-[hsl(var(--auth-text-muted))]">
                      <p>O e-mail informado não está cadastrado em nossa base de dados.</p>
                      <p className="text-sm">Verifique se digitou corretamente ou crie uma nova conta.</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button
                      onClick={handleTryAgain}
                      className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] hover:opacity-90 text-[hsl(var(--auth-text-primary))] font-semibold"
                    >
                      Tentar novamente
                    </Button>
                    <button
                      onClick={handleCancel}
                      className="text-sm text-[hsl(var(--auth-text-muted))] hover:text-[hsl(var(--auth-text-primary))] transition-colors"
                    >
                      Voltar ao login
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AuthThemeProvider>
  );
}
