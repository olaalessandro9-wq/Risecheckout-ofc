/**
 * BuyerAuth - Login page for student panel
 * 
 * MIGRATED to useUnifiedAuth (RISE Protocol V3)
 * 
 * Features:
 * - Login only (registration via invite token or purchase)
 * - Support for ?email= pre-fill
 * - Support for ?redirect= after login
 * - Handle pending password setup flow
 * - Split-screen layout like producer login
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { SUPABASE_URL } from "@/config/supabase";

export default function BuyerAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, login, isLoggingIn } = useUnifiedAuth();

  // Get query params
  const prefillEmail = searchParams.get("email") || "";
  const redirectUrl = searchParams.get("redirect") || "/minha-conta/dashboard";

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirectUrl);
    }
  }, [authLoading, isAuthenticated, navigate, redirectUrl]);

  // Pre-fill email from query param
  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [prefillEmail]);

  const handleEmailBlur = async () => {
    // Check email via unified-auth endpoint for needsPasswordSetup
    if (email) {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-auth/check-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });
        const result = await response.json();
        if (result.exists && result.needsPasswordSetup) {
          setNeedsPasswordSetup(true);
          toast.info("Você precisa definir uma senha para acessar sua conta.");
        } else {
          setNeedsPasswordSetup(false);
        }
      } catch {
        // Ignore check errors
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (needsPasswordSetup) {
        // For pending password setup, redirect to setup page
        toast.info("Você precisa configurar sua senha primeiro.");
        navigate(`/minha-conta/recuperar-senha?email=${encodeURIComponent(email)}`);
        return;
      }
      
      // Use unified-auth login with preferred role "buyer"
      const result = await login(email, password, "buyer");
      
      if (result.success) {
        toast.success("Login realizado com sucesso!");
        // Navigation happens via useEffect when isAuthenticated becomes true
      } else if (result.error?.includes("pendente") || result.error?.includes("senha configurada")) {
        setNeedsPasswordSetup(true);
        toast.info("Você precisa definir uma senha para acessar sua conta.");
      } else {
        toast.error(result.error || "Erro ao fazer login");
      }
    } catch {
      toast.error("Erro de conexão");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--auth-bg))]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--auth-accent))]" />
      </div>
    );
  }

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
                Acesse seus cursos <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-purple))]">
                  e conteúdos exclusivos
                </span>
              </h2>
              <p className="text-lg text-[hsl(var(--auth-text-secondary))] leading-relaxed">
                Sua jornada de aprendizado continua aqui. Entre para acessar todos os seus cursos e materiais comprados.
              </p>
            </motion.div>
          </div>

          {/* Footer Copyright */}
          <div className="relative z-10 text-xs text-[hsl(var(--auth-text-muted))]">
            © 2026 RiseCheckout Inc. Todos os direitos reservados.
          </div>
        </div>

        {/* Right Panel - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12 relative z-10">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-purple))] flex items-center justify-center">
                  <span className="font-bold text-white">R</span>
                </div>
                <span className="font-bold text-lg text-white">RiseCheckout</span>
              </Link>
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Painel do Aluno
              </h1>
              <p className="text-[hsl(var(--auth-text-secondary))]">
                Acesse seus cursos e conteúdos comprados
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[hsl(var(--auth-text-primary))]">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--auth-text-muted))]" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    className="pl-10 bg-[hsl(var(--auth-input-bg))] border-[hsl(var(--auth-border))] text-white placeholder:text-[hsl(var(--auth-text-muted))] focus:border-[hsl(var(--auth-accent))] focus:ring-[hsl(var(--auth-accent)/0.2)]"
                    required
                  />
                </div>
              </div>

              {needsPasswordSetup && (
                <div className="p-3 bg-[hsl(var(--auth-accent)/0.1)] border border-[hsl(var(--auth-accent)/0.2)] rounded-lg">
                  <p className="text-sm text-[hsl(var(--auth-accent))]">
                    Primeira vez acessando? Defina sua senha abaixo.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[hsl(var(--auth-text-primary))]">
                  {needsPasswordSetup ? "Defina sua Senha" : "Senha"}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--auth-text-muted))]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={needsPasswordSetup ? "Mínimo 6 caracteres" : "••••••••"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-[hsl(var(--auth-input-bg))] border-[hsl(var(--auth-border))] text-white placeholder:text-[hsl(var(--auth-text-muted))] focus:border-[hsl(var(--auth-accent))] focus:ring-[hsl(var(--auth-accent)/0.2)]"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--auth-text-muted))] hover:text-[hsl(var(--auth-text-primary))]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-purple))] hover:opacity-90 transition-opacity text-white font-semibold rounded-xl text-base"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {needsPasswordSetup ? "Redirecionando..." : "Entrando..."}
                  </>
                ) : (
                  <>
                    {needsPasswordSetup ? "Configurar Senha" : "Entrar"}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Links below button */}
            <div className="text-center space-y-2">
              <p className="text-sm text-[hsl(var(--auth-text-secondary))]">
                Esqueceu a senha?{" "}
                <Link to="/minha-conta/recuperar-senha" className="text-[hsl(var(--auth-accent))] hover:text-[hsl(var(--auth-accent-hover))] font-medium">
                  Redefina aqui
                </Link>
              </p>
              <p className="text-sm text-[hsl(var(--auth-text-secondary))]">
                Não tem uma conta?{" "}
                <Link to="/minha-conta/cadastro" className="text-[hsl(var(--auth-accent))] hover:text-[hsl(var(--auth-accent-hover))] font-medium">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
