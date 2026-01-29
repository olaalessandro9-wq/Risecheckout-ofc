/**
 * Auth - Login page for producers
 * Uses unified-auth edge function (RISE Protocol V3)
 * 
 * @version 3.0.0 - Blue Theme + Inverted Layout (Form Left, Branding Right)
 */

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { AuthThemeProvider } from "@/components/theme-providers";

const Auth = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading, isLoggingIn } = useUnifiedAuth();
  const [loading, setLoading] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!loginEmail || !loginPassword) {
        toast.error("Preencha todos os campos");
        setLoading(false);
        return;
      }

      // Use unified-auth login with preferred role "user" (producer)
      const result = await login(loginEmail, loginPassword, "user");

      if (!result.success) {
        toast.error(result.error || "Erro ao fazer login");
        setLoading(false);
        return;
      }

      toast.success("Login realizado com sucesso!");
      // Navigation will happen automatically via useEffect when isAuthenticated becomes true
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <AuthThemeProvider>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-[hsl(var(--auth-accent))] animate-spin" />
        </div>
      </AuthThemeProvider>
    );
  }

  return (
    <AuthThemeProvider>
      {/* Background Elements - Blue Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(var(--auth-accent)/0.08)] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(var(--auth-accent-secondary)/0.08)] blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-[hsl(var(--auth-accent-tertiary)/0.05)] blur-[100px]" />
      </div>

      <div className="w-full flex min-h-screen">
        {/* Left Panel - Auth Form (INVERTED) */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12 lg:w-1/2 lg:border-r lg:border-[hsl(var(--auth-border)/0.05)] relative z-10">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] flex items-center justify-center shadow-lg shadow-[hsl(var(--auth-accent)/0.3)]">
                  <span className="font-bold text-[hsl(var(--auth-text-primary))]">R</span>
                </div>
                <span className="font-bold text-lg text-[hsl(var(--auth-text-primary))]">RiseCheckout</span>
              </Link>
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-[hsl(var(--auth-text-primary))] tracking-tight">
                Bem-vindo de volta
              </h1>
              <p className="text-[hsl(var(--auth-text-muted))]">
                Acesse seu painel para gerenciar suas vendas
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[hsl(var(--auth-text-secondary))]">Email</Label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="h-12 bg-[hsl(var(--auth-input-bg)/0.05)] border-[hsl(var(--auth-input-border)/0.1)] text-[hsl(var(--auth-text-primary))] placeholder:text-[hsl(var(--auth-input-placeholder))] focus:border-[hsl(var(--auth-accent))] focus:ring-[hsl(var(--auth-accent)/0.2)] transition-all duration-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[hsl(var(--auth-text-secondary))]">Senha</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="h-12 bg-[hsl(var(--auth-input-bg)/0.05)] border-[hsl(var(--auth-input-border)/0.1)] text-[hsl(var(--auth-text-primary))] placeholder:text-[hsl(var(--auth-input-placeholder))] focus:border-[hsl(var(--auth-accent))] focus:ring-[hsl(var(--auth-accent)/0.2)] transition-all duration-200"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] hover:opacity-90 hover:scale-[1.02] transition-all duration-200 text-[hsl(var(--auth-text-primary))] font-semibold rounded-xl text-base shadow-lg shadow-[hsl(var(--auth-accent)/0.25)]"
              disabled={loading || isLoggingIn}
            >
              {loading || isLoggingIn ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</>
              ) : (
                <>Entrar <ArrowRight className="ml-2 w-4 h-4" /></>
              )}
            </Button>
            </form>

            {/* Links below button */}
            <div className="text-center space-y-2">
              <p className="text-sm text-[hsl(var(--auth-text-muted))]">
                Esqueceu a senha?{" "}
                <Link to="/recuperar-senha" className="text-[hsl(var(--auth-accent))] hover:text-[hsl(var(--auth-accent-secondary))] font-medium transition-colors">
                  Redefina aqui
                </Link>
              </p>
              <p className="text-sm text-[hsl(var(--auth-text-muted))]">
                Não tem uma conta?{" "}
                <Link to="/cadastro" className="text-[hsl(var(--auth-accent))] hover:text-[hsl(var(--auth-accent-secondary))] font-medium transition-colors">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Visual Branding (Desktop Only) (INVERTED) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[hsl(var(--auth-bg-elevated)/0.03)] backdrop-blur-sm flex-col justify-between p-12">
          {/* Logo */}
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 w-fit hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] flex items-center justify-center shadow-lg shadow-[hsl(var(--auth-accent)/0.3)]">
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
                A plataforma de infoprodutos <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))]">
                  que mais converte
                </span>
              </h2>
              <p className="text-lg text-[hsl(var(--auth-text-muted))] leading-relaxed">
                Junte-se a milhares de empreendedores que estão escalando suas vendas com nossa tecnologia de alta performance.
              </p>
            </motion.div>
          </div>

          {/* Footer Copyright */}
          <div className="relative z-10 text-xs text-[hsl(var(--auth-text-subtle))]">
            © 2026 RiseCheckout Inc. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </AuthThemeProvider>
  );
};

export default Auth;
