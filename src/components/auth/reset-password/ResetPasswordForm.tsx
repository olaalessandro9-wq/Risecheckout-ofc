/**
 * ResetPasswordForm - Formulário de Redefinição de Senha
 * 
 * RISE Protocol V3 Compliant - Design Tokens
 * Todas as cores usam o sistema --auth-*
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Lock, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PasswordValidation } from "./types";

interface ResetPasswordFormProps {
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  errorMessage: string;
  passwordValidation: PasswordValidation | null;
  isLoading: boolean;
  cancelRoute: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleShowPassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ResetPasswordForm({
  email,
  password,
  confirmPassword,
  showPassword,
  errorMessage,
  passwordValidation,
  isLoading,
  cancelRoute,
  onPasswordChange,
  onConfirmPasswordChange,
  onToggleShowPassword,
  onSubmit,
}: ResetPasswordFormProps) {
  return (
    <motion.div
      key="form"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[hsl(var(--auth-text-primary))]">Criar Nova Senha</h1>
        {email && (
          <p className="text-[hsl(var(--auth-text-muted))]">
            Definindo senha para <span className="text-[hsl(var(--auth-text-primary))]">{email}</span>
          </p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-[hsl(var(--auth-text-secondary))]">Nova Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="h-12 pr-10 bg-[hsl(var(--auth-input-bg)/0.05)] border-[hsl(var(--auth-input-border)/0.1)] text-[hsl(var(--auth-text-primary))] placeholder:text-[hsl(var(--auth-input-placeholder))] focus:border-[hsl(var(--auth-accent)/0.5)] focus:ring-[hsl(var(--auth-accent)/0.2)]"
            />
            <button
              type="button"
              onClick={onToggleShowPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--auth-text-muted))] hover:text-[hsl(var(--auth-text-primary))]"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-[hsl(var(--auth-text-secondary))]">Confirmar Senha</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
            className="h-12 bg-[hsl(var(--auth-input-bg)/0.05)] border-[hsl(var(--auth-input-border)/0.1)] text-[hsl(var(--auth-text-primary))] placeholder:text-[hsl(var(--auth-input-placeholder))] focus:border-[hsl(var(--auth-accent)/0.5)] focus:ring-[hsl(var(--auth-accent)/0.2)]"
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
        <div className="p-3 rounded-lg bg-[hsl(var(--auth-bg-elevated)/0.05)] border border-[hsl(var(--auth-border)/0.1)] text-[hsl(var(--auth-text-muted))] text-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-[hsl(var(--auth-accent))]" />
            <span className="font-medium text-[hsl(var(--auth-text-secondary))]">Dicas para uma senha forte:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Mínimo de 8 caracteres</li>
            <li>Letras maiúsculas e minúsculas</li>
            <li>Números e caracteres especiais</li>
          </ul>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] hover:from-[hsl(var(--auth-accent))] hover:to-[hsl(var(--auth-accent-secondary))] text-[hsl(var(--auth-text-primary))] font-semibold"
        >
          {isLoading ? (
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
        <Link to={cancelRoute} className="text-sm text-[hsl(var(--auth-text-muted))] hover:text-[hsl(var(--auth-text-primary))] transition-colors">
          Cancelar
        </Link>
      </div>
    </motion.div>
  );
}
