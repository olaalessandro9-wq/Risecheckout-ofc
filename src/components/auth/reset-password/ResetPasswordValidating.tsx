import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function ResetPasswordValidating() {
  return (
    <motion.div
      key="validating"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center space-y-4"
    >
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      <p className="text-slate-400">Validando link...</p>
    </motion.div>
  );
}
