/**
 * Types compartilhados para componentes de redefinição de senha
 * Utilizados tanto por Producer (RedefinirSenha) quanto Buyer (BuyerResetPassword)
 */

export type ViewState = "validating" | "invalid" | "form" | "loading" | "success";

export interface PasswordValidation {
  score: number;
  errors: string[];
  suggestions: string[];
}

export interface ResetPasswordConfig {
  /** URL base do endpoint de autenticação */
  apiEndpoint: string;
  /** Rota para voltar ao login */
  loginRoute: string;
  /** Rota para solicitar novo link de recuperação */
  recoveryRoute: string;
  /** Texto de descrição contextual (ex: "suas vendas" ou "seus cursos") */
  brandDescription: string;
}
