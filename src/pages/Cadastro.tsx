/**
 * Cadastro - Producer registration page
 * Moved from Auth.tsx tabs to dedicated page
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useFormValidation } from "@/hooks/useFormValidation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Cadastro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Signup fields
  const nameField = useFormValidation('name', true);
  const cpfCnpjField = useFormValidation('document', true);
  const phoneField = useFormValidation('phone', true);
  const emailField = useFormValidation('email', true);
  const passwordField = useFormValidation('password', true);

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

      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: emailField.value,
        password: passwordField.value,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            name: nameField.value,
          },
        },
      });

      if (signupError) throw signupError;

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      const { error: profileError } = await (supabase as any)
        .from('vendor_profiles')
        .insert({
          user_id: authData.user.id,
          name: nameField.value,
          phone: phoneField.getRawValue() || '',
          cpf_cnpj: cpfCnpjField.getRawValue(),
        });

      if (profileError) {
        console.error('Erro ao criar perfil do vendedor:', profileError);
        toast.error('Conta criada, mas houve erro ao salvar dados. Entre em contato com suporte.');
      } else {
        toast.success("Cadastro realizado! Verifique seu email.");
        navigate("/auth");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0A0A0B] text-slate-200 overflow-hidden relative">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="w-full flex">
        {/* Left Panel - Visual Branding (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-white/5 backdrop-blur-sm border-r border-white/5 flex-col justify-between p-12">
          {/* Logo */}
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 w-fit hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="font-bold text-white text-xl">R</span>
              </div>
              <span className="font-bold text-xl text-white tracking-tight">RiseCheckout</span>
            </Link>
          </div>

          {/* Feature Highlight */}
          <div className="relative z-10 max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-bold text-white leading-tight">
                Comece a vender <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  em menos de 5 minutos
                </span>
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Crie sua conta gratuitamente e junte-se a milhares de empreendedores que estão escalando suas vendas.
              </p>
            </motion.div>
          </div>

          {/* Footer Copyright */}
          <div className="relative z-10 text-xs text-slate-500">
            © 2025 RiseCheckout Inc. Todos os direitos reservados.
          </div>
        </div>

        {/* Right Panel - Registration Form */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12 relative z-10">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="font-bold text-white">R</span>
                </div>
                <span className="font-bold text-lg text-white">RiseCheckout</span>
              </Link>
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Crie sua conta
              </h1>
              <p className="text-slate-400">
                Comece a vender em menos de 5 minutos
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nome Completo</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Seu nome"
                    value={nameField.value}
                    onChange={nameField.onChange}
                    onBlur={nameField.onBlur}
                    className={`bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-blue-500/20 ${nameField.isTouched ? (nameField.isValid ? "border-green-500/50" : "border-red-500/50") : ""
                      }`}
                    required
                  />
                  {nameField.isTouched && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {nameField.isValid ?
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      }
                    </div>
                  )}
                </div>
                {nameField.error && nameField.isTouched && (
                  <p className="text-xs text-red-400 pl-1">{nameField.error}</p>
                )}
              </div>

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
                      className={`bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-blue-500/20 ${cpfCnpjField.isTouched ? (cpfCnpjField.isValid ? "border-green-500/50" : "border-red-500/50") : ""
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
                      className={`bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-blue-500/20 ${phoneField.isTouched ? (phoneField.isValid ? "border-green-500/50" : "border-red-500/50") : ""
                        }`}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Email</Label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={emailField.value}
                    onChange={emailField.onChange}
                    onBlur={emailField.onBlur}
                    className={`bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-blue-500/20 ${emailField.isTouched ? (emailField.isValid ? "border-green-500/50" : "border-red-500/50") : ""
                      }`}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Senha</Label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="No mínimo 6 caracteres"
                    value={passwordField.value}
                    onChange={passwordField.onChange}
                    onBlur={passwordField.onBlur}
                    className={`bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-blue-500/20 ${passwordField.isTouched ? (passwordField.isValid ? "border-green-500/50" : "border-red-500/50") : ""
                      }`}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity text-white font-semibold rounded-xl text-base"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando conta...</>
                ) : (
                  "Criar conta gratuita"
                )}
              </Button>

              <p className="text-xs text-center text-slate-500">
                Ao se registrar, você concorda com nossos <a href="/termos-de-uso" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Termos de Uso</a> e <a href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Política de Privacidade</a>.
              </p>
            </form>

            {/* Link below form */}
            <div className="text-center">
              <p className="text-sm text-slate-400">
                Já tem uma conta?{" "}
                <Link to="/auth" className="text-blue-400 hover:text-blue-300 font-medium">
                  Faça login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
