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
        <h1 className="text-2xl font-bold text-white">Link Inválido</h1>
        <div className="space-y-2 text-slate-400">
          <p>{errorMessage}</p>
          <p className="text-sm">O link pode ter expirado ou já foi utilizado.</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link to={recoveryRoute}>
          <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold">
            Solicitar novo link
          </Button>
        </Link>
        <Link to={loginRoute} className="block">
          <button className="text-sm text-slate-400 hover:text-white transition-colors">
            Voltar ao login
          </button>
        </Link>
      </div>
    </motion.div>
  );
}
