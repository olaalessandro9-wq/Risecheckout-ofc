/**
 * Componente: BuyerAuthModal
 * 
 * Modal de autenticação de compradores no checkout.
 * Suporta login e registro com validação de formulário.
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, Mail, Lock, User, Phone, FileText } from "lucide-react";

interface BuyerAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (email: string, password: string, name?: string, phone?: string, document?: string) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

type AuthMode = "login" | "register";

export function BuyerAuthModal({
  open,
  onOpenChange,
  onLogin,
  onRegister,
  isLoading = false,
  error,
  onClearError,
}: BuyerAuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setPhone("");
    setDocument("");
    setValidationErrors({});
    onClearError?.();
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validatePassword = (value: string): boolean => {
    return value.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};

    // Validar email
    if (!email.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!validateEmail(email)) {
      errors.email = "Email inválido";
    }

    // Validar senha
    if (!password) {
      errors.password = "Senha é obrigatória";
    } else if (!validatePassword(password)) {
      errors.password = "Senha deve ter pelo menos 8 caracteres";
    }

    // Validar nome no registro
    if (mode === "register" && !name.trim()) {
      errors.name = "Nome é obrigatório";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    if (mode === "login") {
      const result = await onLogin(email.trim(), password);
      if (result.success) {
        onOpenChange(false);
        resetForm();
      }
    } else {
      const result = await onRegister(
        email.trim(),
        password,
        name.trim() || undefined,
        phone.trim() || undefined,
        document.trim() || undefined
      );
      if (result.success) {
        onOpenChange(false);
        resetForm();
      }
    }
  };

  // Formatar CPF
  const formatDocument = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  // Formatar telefone
  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {mode === "login" ? "Entrar na sua conta" : "Criar conta"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Erro geral */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Nome (apenas no registro) */}
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome completo
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                disabled={isLoading}
                className={validationErrors.name ? "border-destructive" : ""}
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive">{validationErrors.name}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={isLoading}
              autoComplete="email"
              className={validationErrors.email ? "border-destructive" : ""}
            />
            {validationErrors.email && (
              <p className="text-sm text-destructive">{validationErrors.email}</p>
            )}
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Mínimo 8 caracteres" : "Sua senha"}
                disabled={isLoading}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className={validationErrors.password ? "border-destructive pr-10" : "pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {validationErrors.password && (
              <p className="text-sm text-destructive">{validationErrors.password}</p>
            )}
          </div>

          {/* Campos adicionais no registro */}
          {mode === "register" && (
            <>
              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone <span className="text-muted-foreground text-xs">(opcional)</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  disabled={isLoading}
                />
              </div>

              {/* CPF */}
              <div className="space-y-2">
                <Label htmlFor="document" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  CPF <span className="text-muted-foreground text-xs">(opcional)</span>
                </Label>
                <Input
                  id="document"
                  type="text"
                  value={document}
                  onChange={(e) => setDocument(formatDocument(e.target.value))}
                  placeholder="000.000.000-00"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Seu CPF é criptografado e armazenado de forma segura.
                </p>
              </div>
            </>
          )}

          {/* Botão de submit */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aguarde...
              </>
            ) : mode === "login" ? (
              "Entrar"
            ) : (
              "Criar conta"
            )}
          </Button>

          {/* Alternar modo */}
          <div className="text-center text-sm">
            {mode === "login" ? (
              <p className="text-muted-foreground">
                Não tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="text-primary hover:underline font-medium"
                  disabled={isLoading}
                >
                  Criar conta
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Já tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-primary hover:underline font-medium"
                  disabled={isLoading}
                >
                  Entrar
                </button>
              </p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
