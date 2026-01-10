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
        <h1 className="text-2xl font-bold text-white">Criar Nova Senha</h1>
        {email && (
          <p className="text-slate-400">
            Definindo senha para <span className="text-white">{email}</span>
          </p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-300">Nova Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="h-12 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={onToggleShowPassword}
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
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
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
          disabled={isLoading}
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold"
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
        <Link to={cancelRoute} className="text-sm text-slate-400 hover:text-white transition-colors">
          Cancelar
        </Link>
      </div>
    </motion.div>
  );
}
