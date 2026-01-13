/**
 * ProducerRegistrationForm - Isolated form component for producer/affiliate registration
 * 
 * This component contains its own form state (useFormValidation hooks) to prevent
 * state loss when AnimatePresence triggers re-mounts in parent components.
 * 
 * Supports both "producer" and "affiliate" registration with dynamic text content.
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useProducerAuth } from "@/hooks/useProducerAuth";
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface ProducerRegistrationFormProps {
  registrationSource: "producer" | "affiliate";
  onBack: () => void;
}

export function ProducerRegistrationForm({
  registrationSource,
  onBack,
}: ProducerRegistrationFormProps) {
  const navigate = useNavigate();
  const { register: registerUser } = useProducerAuth();
  const [loading, setLoading] = useState(false);

  // Form hooks live INSIDE this component to prevent state loss on parent re-render
  const nameField = useFormValidation('name', true);
  const cpfCnpjField = useFormValidation('document', true);
  const phoneField = useFormValidation('phone', true);
  const emailField = useFormValidation('email', true);
  const passwordField = useFormValidation('password', true);

  const isAffiliate = registrationSource === "affiliate";

  // Dynamic text content based on registration type
  const content = {
    title: isAffiliate ? "Seja um Afiliado" : "Crie sua conta",
    subtitle: isAffiliate
      ? "Comece a promover produtos e ganhar comissões"
      : "Comece a vender em menos de 5 minutos",
    buttonText: isAffiliate ? "Criar conta de afiliado" : "Criar conta gratuita",
    loadingText: "Criando conta...",
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isNameValid = nameField.validate();
      const isCpfCnpjValid = cpfCnpjField.validate();
      const isPhoneValid = phoneField.validate();
      const isEmailValid = emailField.validate();
      const isPasswordValid = passwordField.validate();

      if (!isNameValid || !isCpfCnpjValid || !isPhoneValid || !isEmailValid || !isPasswordValid) {
        toast.error("Corrija os erros no formulário antes de continuar");
        setLoading(false);
        return;
      }

      const result = await registerUser({
        email: emailField.value,
        password: passwordField.value,
        name: nameField.value,
        phone: phoneField.getRawValue() || undefined,
        cpfCnpj: cpfCnpjField.getRawValue(),
        registrationSource,
      });

      if (!result.success) {
        if (result.passwordValidation) {
          toast.error(result.passwordValidation.errors.join(", "));
        } else {
          toast.error(result.error || "Erro ao criar conta");
        }
        setLoading(false);
        return;
      }

      toast.success("Cadastro realizado! Faça login para continuar.");
      navigate("/auth");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {content.title}
        </h1>
        <p className="text-slate-400">{content.subtitle}</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        {/* Name Field */}
        <div className="space-y-2">
          <Label className="text-slate-300">Nome Completo</Label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Seu nome"
              value={nameField.value}
              onChange={nameField.onChange}
              onBlur={nameField.onBlur}
              className={`bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-blue-500/20 ${
                nameField.isTouched
                  ? nameField.isValid
                    ? "border-green-500/50"
                    : "border-red-500/50"
                  : ""
              }`}
              required
            />
            {nameField.isTouched && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {nameField.isValid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
          </div>
          {nameField.error && nameField.isTouched && (
            <p className="text-xs text-red-400 pl-1">{nameField.error}</p>
          )}
        </div>

        {/* CPF/CNPJ and Phone */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-300">CPF ou CNPJ</Label>
            <div className="relative">
              <Input
                placeholder="000.000.000-00"
                value={cpfCnpjField.value}
                onChange={cpfCnpjField.onChange}
                onBlur={cpfCnpjField.onBlur}
                maxLength={cpfCnpjField.maxLength}
                className={`bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-blue-500/20 ${
                  cpfCnpjField.isTouched
                    ? cpfCnpjField.isValid
                      ? "border-green-500/50"
                      : "border-red-500/50"
                    : ""
                }`}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Telefone</Label>
            <div className="relative">
              <Input
                placeholder="(00) 00000-0000"
                value={phoneField.value}
                onChange={phoneField.onChange}
                onBlur={phoneField.onBlur}
                maxLength={phoneField.maxLength}
                className={`bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-blue-500/20 ${
                  phoneField.isTouched
                    ? phoneField.isValid
                      ? "border-green-500/50"
                      : "border-red-500/50"
                    : ""
                }`}
                required
              />
            </div>
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label className="text-slate-300">Email</Label>
          <div className="relative">
            <Input
              type="email"
              placeholder="seu@email.com"
              value={emailField.value}
              onChange={emailField.onChange}
              onBlur={emailField.onBlur}
              className={`bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-blue-500/20 ${
                emailField.isTouched
                  ? emailField.isValid
                    ? "border-green-500/50"
                    : "border-red-500/50"
                  : ""
              }`}
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label className="text-slate-300">Senha</Label>
          <div className="relative">
            <Input
              type="password"
              placeholder="No mínimo 8 caracteres"
              value={passwordField.value}
              onChange={passwordField.onChange}
              onBlur={passwordField.onBlur}
              className={`bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-blue-500/20 ${
                passwordField.isTouched
                  ? passwordField.isValid
                    ? "border-green-500/50"
                    : "border-red-500/50"
                  : ""
              }`}
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity text-white font-semibold rounded-xl text-base"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {content.loadingText}
            </>
          ) : (
            content.buttonText
          )}
        </Button>

        {/* Terms */}
        <p className="text-xs text-center text-slate-500">
          Ao se registrar, você concorda com nossos{" "}
          <a
            href="/termos-de-uso"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            Termos de Uso
          </a>{" "}
          e{" "}
          <a
            href="/politica-de-privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            Política de Privacidade
          </a>
          .
        </p>
      </form>

      {/* Footer Links */}
      <div className="text-center space-y-3">
        <p className="text-sm text-slate-400">
          Já tem uma conta?{" "}
          <Link
            to="/auth"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Faça login
          </Link>
        </p>
        <button
          onClick={onBack}
          className="text-sm text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao quiz
        </button>
      </div>
    </motion.div>
  );
}
