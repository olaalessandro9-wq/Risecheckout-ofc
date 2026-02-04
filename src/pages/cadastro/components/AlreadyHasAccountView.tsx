/**
 * AlreadyHasAccountView - Tela "Você já tem conta"
 * 
 * RISE ARCHITECT PROTOCOL V3 - Module-scope component (referência estável)
 */

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { viewVariants } from "../motion";

interface AlreadyHasAccountViewProps {
  onBack: () => void;
}

export function AlreadyHasAccountView({ onBack }: AlreadyHasAccountViewProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={viewVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8"
    >
      <div className="text-center space-y-6">
        {/* Styled Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <CheckSquare className="w-10 h-10 text-[hsl(var(--auth-text-primary))]" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[hsl(var(--auth-text-primary))] tracking-tight">
            Você já tem uma conta!
          </h1>
        </div>
      </div>

      <div className="bg-[hsl(var(--auth-bg-elevated)/0.05)] border border-[hsl(var(--auth-border)/0.1)] rounded-2xl p-6 space-y-4">
        <p className="text-[hsl(var(--auth-text-secondary))] text-center leading-relaxed">
          <strong className="text-[hsl(var(--auth-text-primary))]">Muito bem!</strong> Se você realizou uma compra utilizando seu e-mail, você já tem uma conta no RiseCheckout!
        </p>
        <p className="text-[hsl(var(--auth-text-muted))] text-center text-sm leading-relaxed">
          Se você não sabe sua senha, clique no botão abaixo para criar uma nova senha e acessar suas compras.
        </p>
      </div>

      <div className="space-y-4">
        <Button
          onClick={() => navigate("/minha-conta/recuperar-senha")}
          className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] hover:opacity-90 hover:scale-[1.02] transition-all duration-200 text-[hsl(var(--auth-text-primary))] font-semibold rounded-xl text-base shadow-lg shadow-[hsl(var(--auth-accent)/0.25)]"
        >
          Criar nova senha
        </Button>

        <div className="text-center">
          <button
            onClick={onBack}
            className="text-sm text-[hsl(var(--auth-text-muted))] hover:text-[hsl(var(--auth-text-primary))] transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
