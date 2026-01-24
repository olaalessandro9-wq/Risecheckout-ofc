/**
 * ResetPasswordSuccess - Tela de Sucesso
 * 
 * RISE Protocol V3 Compliant - Design Tokens
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResetPasswordSuccessProps {
  loginRoute: string;
}

export function ResetPasswordSuccess({ loginRoute }: ResetPasswordSuccessProps) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 text-center"
    >
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[hsl(var(--auth-text-primary))]">Senha Redefinida!</h1>
        <p className="text-[hsl(var(--auth-text-muted))]">
          Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
        </p>
      </div>

      {/* Action */}
      <Link to={loginRoute}>
        <Button className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] hover:from-[hsl(var(--auth-accent))] hover:to-[hsl(var(--auth-accent-secondary))] text-[hsl(var(--auth-text-primary))] font-semibold">
          Ir para Login
        </Button>
      </Link>
    </motion.div>
  );
}
