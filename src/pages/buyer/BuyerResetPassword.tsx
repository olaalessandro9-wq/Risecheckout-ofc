/**
 * BuyerResetPassword - Redefinição de senha via token (link do email) para compradores
 * 
 * Refatorado seguindo RISE Protocol: componentes reutilizáveis + hook compartilhado
 */

import { AnimatePresence } from "framer-motion";
import { SUPABASE_URL } from "@/config/supabase";
import { useResetPassword } from "@/hooks/useResetPassword";
import {
  ResetPasswordLayout,
  ResetPasswordValidating,
  ResetPasswordInvalid,
  ResetPasswordForm,
  ResetPasswordSuccess,
  type ResetPasswordConfig,
} from "@/components/auth/reset-password";

const BUYER_CONFIG: ResetPasswordConfig = {
  apiEndpoint: `${SUPABASE_URL}/functions/v1/buyer-auth`,
  loginRoute: "/minha-conta",
  recoveryRoute: "/minha-conta/recuperar-senha",
  brandDescription: "acessando seus cursos",
};

export default function BuyerResetPassword() {
  const {
    viewState,
    email,
    password,
    confirmPassword,
    showPassword,
    errorMessage,
    passwordValidation,
    setPassword,
    setConfirmPassword,
    setShowPassword,
    handleSubmit,
  } = useResetPassword(BUYER_CONFIG);

  return (
    <ResetPasswordLayout config={BUYER_CONFIG}>
      <AnimatePresence mode="wait">
        {viewState === "validating" && <ResetPasswordValidating />}

        {viewState === "invalid" && (
          <ResetPasswordInvalid
            errorMessage={errorMessage}
            recoveryRoute={BUYER_CONFIG.recoveryRoute}
            loginRoute={BUYER_CONFIG.loginRoute}
          />
        )}

        {(viewState === "form" || viewState === "loading") && (
          <ResetPasswordForm
            email={email}
            password={password}
            confirmPassword={confirmPassword}
            showPassword={showPassword}
            errorMessage={errorMessage}
            passwordValidation={passwordValidation}
            isLoading={viewState === "loading"}
            cancelRoute={BUYER_CONFIG.loginRoute}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onToggleShowPassword={() => setShowPassword(!showPassword)}
            onSubmit={handleSubmit}
          />
        )}

        {viewState === "success" && (
          <ResetPasswordSuccess loginRoute={BUYER_CONFIG.loginRoute} />
        )}
      </AnimatePresence>
    </ResetPasswordLayout>
  );
}
