/**
 * useSetupAccess - Hook de lógica para SetupAccess
 * 
 * RISE Protocol V3 - Uses unified-auth as SSOT
 * 
 * Responsabilidades:
 * - Validação de token
 * - Verificação de sessão (via unified-auth)
 * - Estados de loading/error
 * - Ações de login/logout/submit
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { unifiedTokenService } from "@/lib/token-manager";
import { createLogger } from "@/lib/logger";
import type { TokenStatus, TokenInfo, LoggedBuyer } from "../types";

const log = createLogger("useSetupAccess");

interface InviteTokenResponse {
  success?: boolean;
  valid?: boolean;
  error?: string;
  redirect?: boolean;
  reason?: string;
  needsPasswordSetup?: boolean;
  buyer_id?: string;
  product_id?: string;
  product_name?: string;
  product_image?: string;
  buyer_email?: string;
  buyer_name?: string;
  // RISE V3: sessionToken removed - authentication uses httpOnly cookies
}

interface ValidateResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  error?: string;
}

export function useSetupAccess() {
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

  // Grant access for already logged user
  const grantAccessForLoggedUser = useCallback(async (_productId: string) => {
    setIsGrantingAccess(true);
    try {
      const { data, error } = await api.publicCall<InviteTokenResponse>("students-invite", {
        action: "use-invite-token",
        token,
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Acesso liberado!");
        setTimeout(() => {
          navigate("/minha-conta/dashboard");
        }, 500);
      } else {
        throw new Error(data?.error || "Erro ao ativar acesso");
      }
    } catch (err) {
      log.error("Error granting access:", err);
      toast.error("Erro ao liberar acesso. Tente fazer login.");
      setStatus("needs-login");
    } finally {
      setIsGrantingAccess(false);
    }
  }, [token, navigate]);

  // Validate token and check session
  const validateTokenAndCheckSession = useCallback(async () => {
    try {
      // 1. Validate token first
      const { data, error } = await api.publicCall<InviteTokenResponse>("students-invite", {
        action: "validate-invite-token",
        token,
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

      // 2. Check if user is already logged in via unified-auth (RISE V3 SSOT)
      const hasToken = unifiedTokenService.hasValidToken();
      
      if (hasToken) {
        // Validate session via unified-auth
        const { data: sessionData, error: sessionError } = await api.publicCall<ValidateResponse>(
          "unified-auth/validate",
          {}
        );
        
        if (!sessionError && sessionData?.valid && sessionData?.user) {
          const loggedUser = sessionData.user;
          setLoggedBuyer({
            id: loggedUser.id,
            email: loggedUser.email,
            name: loggedUser.name,
          });
          
          const loggedEmail = loggedUser.email.toLowerCase().trim();
          const inviteEmail = info.buyer_email.toLowerCase().trim();
          
          if (loggedEmail === inviteEmail) {
            setStatus("already-logged-correct");
            await grantAccessForLoggedUser(info.product_id);
            return;
          } else {
            setStatus("already-logged-wrong");
            return;
          }
        }
      }

      // 3. User is not logged in - check if needs password
      if (!info.needsPasswordSetup) {
        setStatus("needs-login");
        return;
      }

      // 4. User needs password setup - show form
      setStatus("valid");
    } catch (err) {
      log.error("Error validating token:", err);
      setStatus("invalid");
      setErrorMessage("Erro ao validar o link. Tente novamente.");
    }
  }, [token, grantAccessForLoggedUser]);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setErrorMessage("Link inválido. Nenhum token encontrado.");
      return;
    }

    validateTokenAndCheckSession();
  }, [token, validateTokenAndCheckSession]);

  // Handle logout and continue (RISE V3: use unified token service)
  const handleLogoutAndContinue = useCallback(() => {
    unifiedTokenService.clearTokens();
    setLoggedBuyer(null);
    
    if (tokenInfo?.needsPasswordSetup) {
      setStatus("valid");
    } else {
      setStatus("needs-login");
    }
  }, [tokenInfo]);

  // Redirect to login page
  const redirectToLogin = useCallback(() => {
    const params = new URLSearchParams();
    if (tokenInfo?.buyer_email) {
      params.set("email", tokenInfo.buyer_email);
    }
    params.set("redirect", "/minha-conta/dashboard");
    navigate(`/minha-conta?${params.toString()}`);
  }, [tokenInfo, navigate]);

  // Handle password creation form submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
      const { data, error } = await api.publicCall<InviteTokenResponse>("students-invite", {
        action: "use-invite-token",
        token,
        password,
      });

      if (error) throw error;

      if (data?.success) {
        // RISE V3: Session is established via httpOnly cookies (Set-Cookie header)
        // Notify token manager that session is now active
        unifiedTokenService.setAuthenticated(60 * 60); // 1 hour (access token duration)
        
        log.info("Account created successfully, session established via cookies");
        toast.success("Conta criada com sucesso!");
        navigate("/minha-conta/dashboard");
      } else {
        throw new Error(data?.error || "Erro ao criar conta");
      }
    } catch (err) {
      log.error("Error creating account:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setIsSubmitting(false);
    }
  }, [password, confirmPassword, token, navigate]);

  // Navigate to dashboard
  const navigateToDashboard = useCallback(() => {
    navigate("/minha-conta/dashboard");
  }, [navigate]);

  // Navigate to login
  const navigateToLogin = useCallback(() => {
    navigate("/minha-conta");
  }, [navigate]);

  return {
    // States
    status,
    tokenInfo,
    loggedBuyer,
    errorMessage,
    password,
    confirmPassword,
    showPassword,
    isSubmitting,
    isGrantingAccess,
    
    // Setters
    setPassword,
    setConfirmPassword,
    setShowPassword,
    
    // Actions
    handleLogoutAndContinue,
    redirectToLogin,
    handleSubmit,
    navigateToDashboard,
    navigateToLogin,
  };
}
