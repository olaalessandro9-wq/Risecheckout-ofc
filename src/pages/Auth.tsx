/**
 * Auth - Login page for producers
 * Uses custom producer-auth edge function
 */

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useProducerAuth } from "@/hooks/useProducerAuth";

const Auth = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useProducerAuth();
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

      const result = await login(loginEmail, loginPassword);

      if (!result.success) {
        toast.error(result.error || "Erro ao fazer login");
        setLoading(false);
        return;
      }

      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-[#0A0A0B] text-slate-200 overflow-hidden relative">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="w-full flex">
        {/* Left Panel - Visual Branding (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-white/5 backdrop-blur-sm border-r border-white/5 flex-col justify-between p-12">
          {/* Logo */}
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 w-fit hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
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
                A plataforma de infoprodutos <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  que mais converte
                </span>
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Junte-se a milhares de empreendedores que estão escalando suas vendas com nossa tecnologia de alta performance.
              </p>
            </motion.div>
          </div>

          {/* Footer Copyright */}
          <div className="relative z-10 text-xs text-slate-500">
            © 2025 RiseCheckout Inc. Todos os direitos reservados.
          </div>
        </div>

        {/* Right Panel - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12 relative z-10">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="font-bold text-white">R</span>
                </div>
                <span className="font-bold text-lg text-white">RiseCheckout</span>
              </Link>
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Bem-vindo de volta
              </h1>
              <p className="text-slate-400">
                Acesse seu painel para gerenciar suas vendas
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Email</Label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Senha</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity text-white font-semibold rounded-xl text-base"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</>
                ) : (
                  <>Entrar <ArrowRight className="ml-2 w-4 h-4" /></>
                )}
              </Button>
            </form>

            {/* Links below button */}
            <div className="text-center space-y-2">
              <p className="text-sm text-slate-400">
                Esqueceu a senha?{" "}
                <Link to="/recuperar-senha" className="text-blue-400 hover:text-blue-300 font-medium">
                  Redefina aqui
                </Link>
              </p>
              <p className="text-sm text-slate-400">
                Não tem uma conta?{" "}
                <Link to="/cadastro" className="text-blue-400 hover:text-blue-300 font-medium">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
