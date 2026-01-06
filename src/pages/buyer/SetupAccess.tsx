/**
 * SetupAccess - Page for new students to set up their password via invite token
 */

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type TokenStatus = "loading" | "valid" | "invalid" | "used" | "expired";

interface TokenInfo {
  needsPasswordSetup: boolean;
  buyer_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  buyer_email: string;
  buyer_name: string;
}

export default function SetupAccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<TokenStatus>("loading");
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setErrorMessage("Link inválido. Nenhum token encontrado.");
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("members-area-students", {
        body: {
          action: "validate-invite-token",
          token,
        },
      });

      if (error) throw error;

      if (!data?.valid) {
        if (data?.redirect) {
          setStatus("used");
        } else if (data?.reason?.includes("expirou")) {
          setStatus("expired");
        } else {
          setStatus("invalid");
        }
        setErrorMessage(data?.reason || "Token inválido");
        return;
      }

      setTokenInfo({
        needsPasswordSetup: data.needsPasswordSetup,
        buyer_id: data.buyer_id,
        product_id: data.product_id,
        product_name: data.product_name,
        product_image: data.product_image,
        buyer_email: data.buyer_email,
        buyer_name: data.buyer_name,
      });

      // If user already has password, use token immediately
      if (!data.needsPasswordSetup) {
        await useTokenDirectly();
      } else {
        setStatus("valid");
      }
    } catch (err) {
      console.error("Error validating token:", err);
      setStatus("invalid");
      setErrorMessage("Erro ao validar o link. Tente novamente.");
    }
  };

  const useTokenDirectly = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("members-area-students", {
        body: {
          action: "use-invite-token",
          token,
        },
      });

      if (error) throw error;

      if (data?.success) {
        // Save session token
        localStorage.setItem("buyer_session_token", data.sessionToken);
        
        toast.success("Acesso liberado!");
        
        // Redirect to product
        navigate(`/minha-conta/produto/${data.product_id}`);
      } else {
        throw new Error(data?.error || "Erro ao ativar acesso");
      }
    } catch (err) {
      console.error("Error using token:", err);
      setStatus("invalid");
      setErrorMessage("Erro ao ativar seu acesso. Tente fazer login.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("members-area-students", {
        body: {
          action: "use-invite-token",
          token,
          password,
        },
      });

      if (error) throw error;

      if (data?.success) {
        // Save session token
        localStorage.setItem("buyer_session_token", data.sessionToken);
        
        toast.success("Conta criada com sucesso!");
        
        // Redirect to product
        navigate(`/minha-conta/produto/${data.product_id}`);
      } else {
        throw new Error(data?.error || "Erro ao criar conta");
      }
    } catch (err) {
      console.error("Error creating account:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Validando seu acesso...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (status === "invalid" || status === "used" || status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>
              {status === "used" && "Link já utilizado"}
              {status === "expired" && "Link expirado"}
              {status === "invalid" && "Link inválido"}
            </CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => navigate("/minha-conta")} className="w-full">
              Ir para Login
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Se você já criou sua conta, faça login normalmente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid token - show password setup form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Bem-vindo{tokenInfo?.buyer_name ? `, ${tokenInfo.buyer_name.split(" ")[0]}` : ""}!</CardTitle>
          <CardDescription>
            Crie sua senha para acessar <strong>{tokenInfo?.product_name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Product preview */}
          {tokenInfo?.product_image && (
            <div className="mb-6 rounded-lg overflow-hidden border">
              <img
                src={tokenInfo.product_image}
                alt={tokenInfo.product_name}
                className="w-full h-32 object-cover"
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email display */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <div className="px-3 py-2 rounded-md bg-muted text-sm">
                {tokenInfo?.buyer_email}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Criar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10"
                  disabled={isSubmitting}
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar senha e acessar"
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Ao criar sua conta, você concorda com nossos termos de uso.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
