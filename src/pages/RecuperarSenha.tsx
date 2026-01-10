/**
 * RecuperarSenha - Password recovery page for producers
 * Placeholder - will be implemented in next phase
 */

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function RecuperarSenha() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0B] text-slate-200 p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-white">Recuperar Senha</h1>
        <p className="text-slate-400">
          Esta página está em construção. Em breve você poderá recuperar sua senha por aqui.
        </p>
        <Link to="/auth">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </Button>
        </Link>
      </div>
    </div>
  );
}
