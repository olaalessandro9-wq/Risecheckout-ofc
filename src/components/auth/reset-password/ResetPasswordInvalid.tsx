/**
 * ResetPasswordInvalid - Tela de Link Inválido
 * 
 * RISE Protocol V3 Compliant - Design Tokens
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResetPasswordInvalidProps {
  errorMessage: string;
  recoveryRoute: string;
  loginRoute: string;
}

export function ResetPasswordInvalid({ 
  errorMessage, 
  recoveryRoute, 
  loginRoute 
}: ResetPasswordInvalidProps) {
  return (
    <motion.div
      key="invalid"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 text-center"
    >
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[hsl(var(--auth-text-primary))]">Link Inválido</h1>
        <div className="space-y-2 text-[hsl(var(--auth-text-muted))]">
          <p>{errorMessage}</p>
          <p className="text-sm">O link pode ter expirado ou já foi utilizado.</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link to={recoveryRoute}>
          <Button className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] hover:from-[hsl(var(--auth-accent))] hover:to-[hsl(var(--auth-accent-secondary))] text-[hsl(var(--auth-text-primary))] font-semibold">
            Solicitar novo link
          </Button>
        </Link>
        <Link to={loginRoute} className="block">
          <button className="text-sm text-[hsl(var(--auth-text-muted))] hover:text-[hsl(var(--auth-text-primary))] transition-colors">
            Voltar ao login
          </button>
        </Link>
      </div>
    </motion.div>
  );
}
