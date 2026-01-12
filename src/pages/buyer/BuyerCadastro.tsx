/**
 * BuyerCadastro - Student registration/profile choice page
 * Shows options: "Quero ver minhas compras", "Sou produtor", or "Quero ser afiliado"
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Package, ArrowLeft, CheckCircle, Users } from "lucide-react";
import { motion } from "framer-motion";

type View = "choose-profile" | "already-has-account";

export default function BuyerCadastro() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("choose-profile");

  const handleBuyerChoice = () => {
    setView("already-has-account");
  };

  const handleProducerChoice = () => {
    navigate("/cadastro?perfil=produtor");
  };

  const handleAffiliateChoice = () => {
    navigate("/cadastro?perfil=afiliado");
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
                Estamos aqui <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  para te ajudar
                </span>
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Vamos encontrar a melhor forma de você acessar o que precisa.
              </p>
            </motion.div>
          </div>

          {/* Footer Copyright */}
          <div className="relative z-10 text-xs text-slate-500">
            © 2025 RiseCheckout Inc. Todos os direitos reservados.
          </div>
        </div>

        {/* Right Panel - Content */}
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

            {view === "choose-profile" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    Antes de tudo...
                  </h1>
                  <p className="text-slate-400">
                    Nos conte qual perfil você se identifica no momento:
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Buyer Option */}
                  <button
                    onClick={handleBuyerChoice}
                    className="w-full p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 transition-all duration-300 text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <ShoppingBag className="w-6 h-6 text-white" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-white text-lg">
                          Quero ver minhas compras
                        </h3>
                        <p className="text-sm text-slate-400">
                          Sou cliente que comprou um produto e quero acessar meu conteúdo
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Producer Option */}
                  <button
                    onClick={handleProducerChoice}
                    className="w-full p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300 text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-white text-lg">
                          Sou produtor
                        </h3>
                        <p className="text-sm text-slate-400">
                          Tenho meu próprio produto e quero começar a vender
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Affiliate Option */}
                  <button
                    onClick={handleAffiliateChoice}
                    className="w-full p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/50 transition-all duration-300 text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-white text-lg">
                          Quero ser afiliado
                        </h3>
                        <p className="text-sm text-slate-400">
                          Quero promover produtos de outros produtores e ganhar comissões
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="text-center">
                  <Link to="/minha-conta" className="text-sm text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao login
                  </Link>
                </div>
              </motion.div>
            )}

            {view === "already-has-account" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Você já tem uma conta!
                  </h1>
                </div>

                <div className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-4">
                  <p className="text-slate-300 text-center">
                    <strong>Muito bem!</strong> Se você realizou uma compra ou recebeu um convite, você já tem uma conta no RiseCheckout!
                  </p>
                  <p className="text-slate-400 text-sm text-center">
                    Se você não sabe sua senha, clique no botão abaixo para criar uma nova senha.
                  </p>
                </div>

                <Link to="/minha-conta/recuperar-senha" className="block">
                  <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity text-white font-semibold rounded-xl text-base">
                    Criar nova senha
                  </Button>
                </Link>

                <div className="text-center">
                  <button
                    onClick={() => setView("choose-profile")}
                    className="text-sm text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
