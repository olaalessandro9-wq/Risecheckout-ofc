/**
 * SetupPasswordForm - Formulário de criação de senha
 */

import { Lock, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TokenInfo } from "../types";

interface SetupPasswordFormProps {
  tokenInfo: TokenInfo | null;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  isSubmitting: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleShowPassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SetupPasswordForm({
  tokenInfo,
  password,
  confirmPassword,
  showPassword,
  isSubmitting,
  onPasswordChange,
  onConfirmPasswordChange,
  onToggleShowPassword,
  onSubmit,
}: SetupPasswordFormProps) {
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

          <form onSubmit={onSubmit} className="space-y-4">
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
                  onChange={(e) => onPasswordChange(e.target.value)}
                  className="pl-9 pr-10"
                  disabled={isSubmitting}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={onToggleShowPassword}
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
                  onChange={(e) => onConfirmPasswordChange(e.target.value)}
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
