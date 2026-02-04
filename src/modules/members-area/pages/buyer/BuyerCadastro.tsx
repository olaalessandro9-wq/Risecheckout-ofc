/**
 * BuyerCadastro - Student registration/profile choice page
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Uses BuyerAuthLayout for unified theme and layout.
 * 
 * Shows options: "Quero ver minhas compras", "Sou produtor", or "Quero ser afiliado"
 * 
 * @module members-area/pages/buyer
 * @version 4.0.0
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Package, ArrowLeft, CheckCircle, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BuyerAuthLayout } from "@/modules/members-area/components";

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

  // Determine branding based on view
  const brandingTitle = view === "already-has-account" ? (
    <>
      Você já está <br />
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))]">
        quase lá
      </span>
    </>
  ) : (
    <>
      Estamos aqui <br />
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))]">
        para te ajudar
      </span>
    </>
  );

  const brandingDescription = view === "already-has-account"
    ? "Recupere sua senha para acessar seus cursos e conteúdos."
    : "Vamos encontrar a melhor forma de você acessar o que precisa.";

  return (
    <BuyerAuthLayout
      brandingTitle={brandingTitle}
      brandingDescription={brandingDescription}
    >
      <AnimatePresence mode="wait">
        {view === "choose-profile" && (
          <motion.div
            key="choose-profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-[hsl(var(--auth-text-primary))] tracking-tight">
                Antes de tudo...
              </h1>
              <p className="text-[hsl(var(--auth-text-muted))]">
                Nos conte qual perfil você se identifica no momento:
              </p>
            </div>

            <div className="space-y-4">
              {/* Buyer Option */}
              <button
                onClick={handleBuyerChoice}
                className="w-full p-6 rounded-2xl border border-[hsl(var(--auth-border)/0.1)] bg-[hsl(var(--auth-panel-bg)/0.05)] hover:bg-[hsl(var(--auth-panel-bg-hover)/0.08)] hover:border-[hsl(var(--auth-accent)/0.5)] transition-all duration-300 text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-[hsl(var(--auth-accent)/0.3)]">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-[hsl(var(--auth-text-primary))] text-lg">
                      Quero ver minhas compras
                    </h3>
                    <p className="text-sm text-[hsl(var(--auth-text-muted))]">
                      Sou cliente que comprou um produto e quero acessar meu conteúdo
                    </p>
                  </div>
                </div>
              </button>

              {/* Producer Option */}
              <button
                onClick={handleProducerChoice}
                className="w-full p-6 rounded-2xl border border-[hsl(var(--auth-border)/0.1)] bg-[hsl(var(--auth-panel-bg)/0.05)] hover:bg-[hsl(var(--auth-panel-bg-hover)/0.08)] hover:border-[hsl(var(--auth-accent-secondary)/0.5)] transition-all duration-300 text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--auth-accent-secondary))] to-[hsl(var(--auth-accent-tertiary))] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-[hsl(var(--auth-accent-secondary)/0.3)]">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-[hsl(var(--auth-text-primary))] text-lg">
                      Sou produtor
                    </h3>
                    <p className="text-sm text-[hsl(var(--auth-text-muted))]">
                      Tenho meu próprio produto e quero começar a vender
                    </p>
                  </div>
                </div>
              </button>

              {/* Affiliate Option */}
              <button
                onClick={handleAffiliateChoice}
                className="w-full p-6 rounded-2xl border border-[hsl(var(--auth-border)/0.1)] bg-[hsl(var(--auth-panel-bg)/0.05)] hover:bg-[hsl(var(--auth-panel-bg-hover)/0.08)] hover:border-emerald-500/50 transition-all duration-300 text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/30">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-[hsl(var(--auth-text-primary))] text-lg">
                      Quero ser afiliado
                    </h3>
                    <p className="text-sm text-[hsl(var(--auth-text-muted))]">
                      Quero promover produtos de outros produtores e ganhar comissões
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="text-center">
              <Link to="/minha-conta" className="text-sm text-[hsl(var(--auth-text-muted))] hover:text-[hsl(var(--auth-text-primary))] transition-colors inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao login
              </Link>
            </div>
          </motion.div>
        )}

        {view === "already-has-account" && (
          <motion.div
            key="already-has-account"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-[hsl(var(--auth-success)/0.1)] flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-[hsl(var(--auth-success))]" />
              </div>
              <h1 className="text-2xl font-bold text-[hsl(var(--auth-text-primary))] tracking-tight">
                Você já tem uma conta!
              </h1>
            </div>

            <div className="p-6 rounded-xl border border-[hsl(var(--auth-border)/0.1)] bg-[hsl(var(--auth-panel-bg)/0.05)] space-y-4">
              <p className="text-[hsl(var(--auth-text-primary))] text-center">
                <strong>Muito bem!</strong> Se você realizou uma compra ou recebeu um convite, você já tem uma conta no RiseCheckout!
              </p>
              <p className="text-[hsl(var(--auth-text-muted))] text-sm text-center">
                Se você não sabe sua senha, clique no botão abaixo para criar uma nova senha.
              </p>
            </div>

            <Link to="/minha-conta/recuperar-senha" className="block">
              <Button className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] hover:opacity-90 hover:scale-[1.02] transition-all text-white font-semibold rounded-xl text-base shadow-lg shadow-[hsl(var(--auth-accent)/0.3)]">
                Criar nova senha
              </Button>
            </Link>

            <div className="text-center">
              <button
                onClick={() => setView("choose-profile")}
                className="text-sm text-[hsl(var(--auth-text-muted))] hover:text-[hsl(var(--auth-text-primary))] transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BuyerAuthLayout>
  );
}
