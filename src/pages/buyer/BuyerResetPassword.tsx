/**
 * BuyerResetPassword - Redefinição de senha via token (link do email)
 * 
 * Estados:
 * 1. validating - Validando token
 * 2. invalid - Token inválido ou expirado
 * 3. form - Formulário para nova senha
 * 4. loading - Processando redefinição
 * 5. success - Senha redefinida com sucesso
 */

import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, AlertCircle, CheckCircle, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPABASE_URL } from "@/config/supabase";

type ViewState = "validating" | "invalid" | "form" | "loading" | "success";

interface PasswordValidation {
  score: number;
  errors: string[];
  suggestions: string[];
}

export default function BuyerResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

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

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth/verify-reset-token`, {
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
    } catch (error) {
      console.error("Error validating token:", error);
      setErrorMessage("Erro ao validar link. Tente novamente.");
      setViewState("invalid");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth/reset-password`, {
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
    } catch (error) {
      console.error("Error resetting password:", error);
      setErrorMessage("Erro de conexão. Tente novamente.");
      setViewState("form");
    }
  };

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
                Crie uma nova senha <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  segura
                </span>
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Defina uma senha forte para proteger sua conta e acessar seus cursos.
              </p>
            </motion.div>
          </div>

          {/* Footer Copyright */}
          <div className="relative z-10 text-xs text-slate-500">
            © 2025 RiseCheckout Inc. Todos os direitos reservados.
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12 relative z-10">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="font-bold text-white">R</span>
                </div>
                <span className="font-bold text-lg text-white">RiseCheckout</span>
              </Link>
            </div>

            <AnimatePresence mode="wait">
              {/* View: Validating */}
              {viewState === "validating" && (
                <motion.div
                  key="validating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center space-y-4"
                >
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                  <p className="text-slate-400">Validando link...</p>
                </motion.div>
              )}

              {/* View: Invalid Token */}
              {viewState === "invalid" && (
                <motion.div
                  key="invalid"
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
                    <h1 className="text-2xl font-bold text-white">Link Inválido</h1>
                    <div className="space-y-2 text-slate-400">
                      <p>{errorMessage}</p>
                      <p className="text-sm">O link pode ter expirado ou já foi utilizado.</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Link to="/minha-conta/recuperar-senha">
                      <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold">
                        Solicitar novo link
                      </Button>
                    </Link>
                    <Link to="/minha-conta" className="block">
                      <button className="text-sm text-slate-400 hover:text-white transition-colors">
                        Voltar ao login
                      </button>
                    </Link>
                  </div>
                </motion.div>
              )}

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
                    <h1 className="text-2xl font-bold text-white">Criar Nova Senha</h1>
                    {email && (
                      <p className="text-slate-400">
                        Definindo senha para <span className="text-white">{email}</span>
                      </p>
                    )}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-300">Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          disabled={viewState === "loading"}
                          className="h-12 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-slate-300">Confirmar Senha</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={viewState === "loading"}
                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Error Messages */}
                    {errorMessage && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {errorMessage}
                      </div>
                    )}

                    {/* Password Validation Errors */}
                    {passwordValidation && passwordValidation.errors.length > 0 && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm space-y-1">
                        <p className="font-medium">A senha precisa:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {passwordValidation.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Password Tips */}
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                        <span className="font-medium text-slate-300">Dicas para uma senha forte:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Mínimo de 8 caracteres</li>
                        <li>Letras maiúsculas e minúsculas</li>
                        <li>Números e caracteres especiais</li>
                      </ul>
                    </div>

                    <Button
                      type="submit"
                      disabled={viewState === "loading"}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold"
                    >
                      {viewState === "loading" ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5 mr-2" />
                          Redefinir Senha
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Cancel Link */}
                  <div className="text-center">
                    <Link to="/minha-conta" className="text-sm text-slate-400 hover:text-white transition-colors">
                      Cancelar
                    </Link>
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
                    <h1 className="text-2xl font-bold text-white">Senha Redefinida!</h1>
                    <p className="text-slate-400">
                      Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
                    </p>
                  </div>

                  {/* Action */}
                  <Link to="/minha-conta">
                    <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold">
                      Ir para Login
                    </Button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
