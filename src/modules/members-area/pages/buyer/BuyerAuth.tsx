/**
 * BuyerAuth - Login page for student panel
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Uses BuyerAuthLayout for unified theme and layout.
 * 
 * Features:
 * - Login only (registration via invite token or purchase)
 * - Support for ?email= pre-fill
 * - Support for ?redirect= after login
 * - Handle pending password setup flow
 * 
 * @module members-area/pages/buyer
 * @version 4.0.0
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthInput } from "@/components/auth/ui";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { SUPABASE_URL } from "@/config/supabase";
import { BuyerAuthLayout } from "@/modules/members-area/components";

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

  // Loading state uses AuthPageLoader via Suspense in routes
  if (authLoading) {
    return (
      <BuyerAuthLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--auth-accent))]" />
        </div>
      </BuyerAuthLayout>
    );
  }

  return (
    <BuyerAuthLayout
      brandingTitle={
        <>
          Acesse seus cursos <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))]">
            e conteúdos exclusivos
          </span>
        </>
      }
      brandingDescription="Sua jornada de aprendizado continua aqui. Entre para acessar todos os seus cursos e materiais comprados."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-[hsl(var(--auth-text-primary))] tracking-tight">
            Painel do Aluno
          </h1>
          <p className="text-[hsl(var(--auth-text-muted))]">
            Acesse seus cursos e conteúdos comprados
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[hsl(var(--auth-text-primary))]">Email</Label>
            <AuthInput
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />
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
            <AuthInput
              type={showPassword ? "text" : "password"}
              placeholder={needsPasswordSetup ? "Mínimo 6 caracteres" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[hsl(var(--auth-text-muted))] hover:text-[hsl(var(--auth-text-primary))] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] hover:opacity-90 hover:scale-[1.02] transition-all text-white font-semibold rounded-xl text-base shadow-lg shadow-[hsl(var(--auth-accent)/0.3)]"
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
          <p className="text-sm text-[hsl(var(--auth-text-muted))]">
            Esqueceu a senha?{" "}
            <Link to="/minha-conta/recuperar-senha" className="text-[hsl(var(--auth-accent))] hover:text-[hsl(var(--auth-accent-hover))] font-medium">
              Redefina aqui
            </Link>
          </p>
          <p className="text-sm text-[hsl(var(--auth-text-muted))]">
            Não tem uma conta?{" "}
            <Link to="/minha-conta/cadastro" className="text-[hsl(var(--auth-accent))] hover:text-[hsl(var(--auth-accent-hover))] font-medium">
              Cadastre-se
            </Link>
          </p>
        </div>
      </motion.div>
    </BuyerAuthLayout>
  );
}
