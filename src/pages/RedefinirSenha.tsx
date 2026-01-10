/**
 * RedefinirSenha - Redefinição de senha via token (link do email) para produtores
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

const PRODUCER_CONFIG: ResetPasswordConfig = {
  apiEndpoint: `${SUPABASE_URL}/functions/v1/producer-auth`,
  loginRoute: "/auth",
  recoveryRoute: "/recuperar-senha",
  brandDescription: "gerenciando suas vendas",
};

export default function RedefinirSenha() {
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
  } = useResetPassword(PRODUCER_CONFIG);

  return (
    <ResetPasswordLayout config={PRODUCER_CONFIG}>
      <AnimatePresence mode="wait">
        {viewState === "validating" && <ResetPasswordValidating />}

        {viewState === "invalid" && (
          <ResetPasswordInvalid
            errorMessage={errorMessage}
            recoveryRoute={PRODUCER_CONFIG.recoveryRoute}
            loginRoute={PRODUCER_CONFIG.loginRoute}
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
            cancelRoute={PRODUCER_CONFIG.loginRoute}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onToggleShowPassword={() => setShowPassword(!showPassword)}
            onSubmit={handleSubmit}
          />
        )}

        {viewState === "success" && (
          <ResetPasswordSuccess loginRoute={PRODUCER_CONFIG.loginRoute} />
        )}
      </AnimatePresence>
    </ResetPasswordLayout>
  );
}
