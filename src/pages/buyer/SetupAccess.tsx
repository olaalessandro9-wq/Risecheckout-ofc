/**
 * SetupAccess - Intelligent access setup page for members area
 * 
 * Flow:
 * 1. Validate token
 * 2. Check if user is already logged in (local session)
 * 3. If logged in with same email → grant access automatically
 * 4. If logged in with different email → show switch account prompt
 * 5. If user has password but not logged in → redirect to login
 * 6. If user needs password setup → show password creation form
 * 7. Token can only create password ONCE (used flag)
 */

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, LogIn, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  getBuyerSessionToken, 
  clearBuyerSessionToken,
  setBuyerSessionToken 
} from "@/hooks/useBuyerSession";

type TokenStatus = 
  | "loading" 
  | "valid" 
  | "invalid" 
  | "used" 
  | "expired"
  | "already-logged-correct"
  | "already-logged-wrong"
  | "needs-login";

interface TokenInfo {
  needsPasswordSetup: boolean;
  buyer_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  buyer_email: string;
  buyer_name: string;
}

interface LoggedBuyer {
  id: string;
  email: string;
  name: string | null;
}

export default function SetupAccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<TokenStatus>("loading");
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [loggedBuyer, setLoggedBuyer] = useState<LoggedBuyer | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGrantingAccess, setIsGrantingAccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setErrorMessage("Link inválido. Nenhum token encontrado.");
      return;
    }

    validateTokenAndCheckSession();
  }, [token]);

  /**
   * Validate token and check current session
   */
  const validateTokenAndCheckSession = async () => {
    try {
      // 1. Validate token first
      const { data, error } = await supabase.functions.invoke("students-invite/validate-invite-token", {
        body: {
          token,
        },
      });

      if (error) throw error;

      // Handle invalid/used/expired tokens
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

      // Store token info
      const info: TokenInfo = {
        needsPasswordSetup: data.needsPasswordSetup,
        buyer_id: data.buyer_id,
        product_id: data.product_id,
        product_name: data.product_name,
        product_image: data.product_image,
        buyer_email: data.buyer_email,
        buyer_name: data.buyer_name,
      };
      setTokenInfo(info);

      // 2. Check if user is already logged in
      const sessionToken = getBuyerSessionToken();
      
      if (sessionToken) {
        // Validate current session
        const sessionResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL || "https://zwnvfybdoxpcvpntapmg.supabase.co"}/functions/v1/buyer-auth/validate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionToken }),
          }
        );
        
        const sessionData = await sessionResponse.json();
        
        if (sessionData.valid && sessionData.buyer) {
          setLoggedBuyer(sessionData.buyer);
          
          const loggedEmail = sessionData.buyer.email.toLowerCase().trim();
          const inviteEmail = info.buyer_email.toLowerCase().trim();
          
          if (loggedEmail === inviteEmail) {
            // Same email - grant access automatically
            setStatus("already-logged-correct");
            await grantAccessForLoggedUser(info.product_id);
            return;
          } else {
            // Different email - show switch account prompt
            setStatus("already-logged-wrong");
            return;
          }
        }
      }

      // 3. User is not logged in - check if needs password
      if (!info.needsPasswordSetup) {
        // User already has password - redirect to login
        setStatus("needs-login");
        return;
      }

      // 4. User needs password setup - show form
      setStatus("valid");
    } catch (err) {
      console.error("Error validating token:", err);
      setStatus("invalid");
      setErrorMessage("Erro ao validar o link. Tente novamente.");
    }
  };

  /**
   * Grant access for already logged user
   */
  const grantAccessForLoggedUser = async (productId: string) => {
    setIsGrantingAccess(true);
    try {
      // Use the token to grant access (without password since user already has one)
      const { data, error } = await supabase.functions.invoke("students-invite/use-invite-token", {
        body: {
          token,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Acesso liberado!");
        // Navigate to student dashboard (Meus Cursos)
        setTimeout(() => {
          navigate("/minha-conta/dashboard");
        }, 500);
      } else {
        throw new Error(data?.error || "Erro ao ativar acesso");
      }
    } catch (err) {
      console.error("Error granting access:", err);
      toast.error("Erro ao liberar acesso. Tente fazer login.");
      setStatus("needs-login");
    } finally {
      setIsGrantingAccess(false);
    }
  };

  /**
   * Handle logout and continue with invite
   */
  const handleLogoutAndContinue = () => {
    clearBuyerSessionToken();
    setLoggedBuyer(null);
    
    // Re-check - now user is logged out
    if (tokenInfo?.needsPasswordSetup) {
      setStatus("valid");
    } else {
      setStatus("needs-login");
    }
  };

  /**
   * Redirect to login page with params
   */
  const redirectToLogin = () => {
    const params = new URLSearchParams();
    if (tokenInfo?.buyer_email) {
      params.set("email", tokenInfo.buyer_email);
    }
    // Always redirect to dashboard (Meus Cursos) after login
    params.set("redirect", "/minha-conta/dashboard");
    navigate(`/minha-conta?${params.toString()}`);
  };

  /**
   * Handle password creation form submit
   */
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
      const { data, error } = await supabase.functions.invoke("students-invite/use-invite-token", {
        body: {
          token,
          password,
        },
      });

      if (error) throw error;

      if (data?.success) {
        // Save session token
        setBuyerSessionToken(data.sessionToken);
        
        toast.success("Conta criada com sucesso!");
        
        // Redirect to student dashboard (Meus Cursos)
        navigate("/minha-conta/dashboard");
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

  // =========================================================================
  // RENDER STATES
  // =========================================================================

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

  // Already logged in with CORRECT email - auto granting access
  if (status === "already-logged-correct") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          {isGrantingAccess ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Liberando seu acesso...</p>
            </>
          ) : (
            <>
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <p className="text-lg font-medium">Acesso liberado!</p>
              <p className="text-muted-foreground">Redirecionando...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Already logged in with DIFFERENT email - prompt to switch
  if (status === "already-logged-wrong") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <UserX className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle>Conta Diferente</CardTitle>
            <CardDescription>
              Você está logado como <strong>{loggedBuyer?.email}</strong>, 
              mas este convite é para <strong>{tokenInfo?.buyer_email}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={handleLogoutAndContinue} className="w-full">
              Sair e Continuar com {tokenInfo?.buyer_email?.split("@")[0]}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/minha-conta/dashboard")} 
              className="w-full"
            >
              Continuar com {loggedBuyer?.email?.split("@")[0]}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Ao trocar de conta, você sairá da conta atual.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has password but not logged in - redirect to login
  if (status === "needs-login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Faça Login para Acessar</CardTitle>
            <CardDescription>
              Você já possui uma conta! Faça login para acessar <strong>{tokenInfo?.product_name}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {/* Product preview */}
            {tokenInfo?.product_image && (
              <div className="mb-3 rounded-lg overflow-hidden border">
                <img
                  src={tokenInfo.product_image}
                  alt={tokenInfo.product_name}
                  className="w-full h-24 object-cover"
                />
              </div>
            )}
            
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Seu email:</p>
              <p className="font-medium">{tokenInfo?.buyer_email}</p>
            </div>
            
            <Button onClick={redirectToLogin} className="w-full mt-2">
              <LogIn className="h-4 w-4 mr-2" />
              Ir para Login
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Após o login, você será redirecionado automaticamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error states (invalid, used, expired)
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
