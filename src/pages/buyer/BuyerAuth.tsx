/**
 * BuyerAuth - Login page for members area (no registration tab)
 * 
 * Features:
 * - Login only (registration via invite token only)
 * - Support for ?email= pre-fill
 * - Support for ?redirect= after login
 * - Handle pending password setup flow
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useBuyerAuth } from "@/hooks/useBuyerAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";

export default function BuyerAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, login, register, checkEmail } = useBuyerAuth();

  // Get query params
  const prefillEmail = searchParams.get("email") || "";
  const redirectUrl = searchParams.get("redirect") || "/minha-conta/dashboard";

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    if (email) {
      const result = await checkEmail(email);
      if (result.exists && result.needsPasswordSetup) {
        setNeedsPasswordSetup(true);
        toast.info("Você precisa definir uma senha para acessar sua conta.");
      } else {
        setNeedsPasswordSetup(false);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (needsPasswordSetup) {
        // Register flow for pending password
        const result = await register(email, password, "");
        if (result.success) {
          toast.success("Senha definida com sucesso!");
          // After setting password, do login automatically
          const loginResult = await login(email, password);
          if (loginResult.success) {
            navigate(redirectUrl);
          }
        } else {
          toast.error(result.error || "Erro ao definir senha");
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          toast.success("Login realizado com sucesso!");
          navigate(redirectUrl);
        } else if (result.needsPasswordSetup) {
          setNeedsPasswordSetup(true);
          toast.info("Você precisa definir uma senha para acessar sua conta.");
        } else {
          toast.error(result.error || "Erro ao fazer login");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Painel do Aluno</CardTitle>
          <CardDescription>
            Acesse seus cursos e conteúdos comprados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {needsPasswordSetup && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary">
                  Primeira vez acessando? Defina sua senha abaixo.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-password">
                {needsPasswordSetup ? "Defina sua Senha" : "Senha"}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={needsPasswordSetup ? "Mínimo 6 caracteres" : "••••••••"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {needsPasswordSetup ? "Definindo..." : "Entrando..."}
                </>
              ) : (
                needsPasswordSetup ? "Definir Senha e Entrar" : "Entrar"
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-6">
            Seu acesso é criado automaticamente ao comprar um produto ou receber um convite.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
