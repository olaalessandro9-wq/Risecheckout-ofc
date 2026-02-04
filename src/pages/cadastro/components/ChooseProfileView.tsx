/**
 * ChooseProfileView - Quiz de seleção de perfil
 * 
 * RISE ARCHITECT PROTOCOL V3 - Module-scope component (referência estável)
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Package, Users, ArrowLeft } from "lucide-react";
import { viewVariants } from "../motion";

interface ChooseProfileViewProps {
  onBuyerChoice: () => void;
  onProducerChoice: () => void;
  onAffiliateChoice: () => void;
}

export function ChooseProfileView({
  onBuyerChoice,
  onProducerChoice,
  onAffiliateChoice,
}: ChooseProfileViewProps) {
  return (
    <motion.div
      variants={viewVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8"
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
        {/* Option: Buyer */}
        <button
          onClick={onBuyerChoice}
          className="w-full p-6 rounded-2xl border border-[hsl(var(--auth-border)/0.1)] bg-[hsl(var(--auth-bg-elevated)/0.05)] hover:bg-[hsl(var(--auth-bg-elevated)/0.1)] hover:border-[hsl(var(--auth-accent)/0.5)] transition-all duration-300 text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-[hsl(var(--auth-accent)/0.25)]">
              <ShoppingBag className="w-6 h-6 text-[hsl(var(--auth-text-primary))]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-[hsl(var(--auth-text-primary))] text-lg">Quero ver minhas compras</h3>
              <p className="text-sm text-[hsl(var(--auth-text-muted))]">
                Sou cliente e comprei algum produto. Quero acessar meus cursos e conteúdos.
              </p>
            </div>
          </div>
        </button>

        {/* Option: Producer */}
        <button
          onClick={onProducerChoice}
          className="w-full p-6 rounded-2xl border border-[hsl(var(--auth-border)/0.1)] bg-[hsl(var(--auth-bg-elevated)/0.05)] hover:bg-[hsl(var(--auth-bg-elevated)/0.1)] hover:border-[hsl(var(--auth-accent-secondary)/0.5)] transition-all duration-300 text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--auth-accent-secondary))] to-[hsl(var(--auth-accent-tertiary))] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-[hsl(var(--auth-accent-secondary)/0.25)]">
              <Package className="w-6 h-6 text-[hsl(var(--auth-text-primary))]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-[hsl(var(--auth-text-primary))] text-lg">Sou produtor</h3>
              <p className="text-sm text-[hsl(var(--auth-text-muted))]">
                Tenho meu próprio produto digital e quero vender pela plataforma.
              </p>
            </div>
          </div>
        </button>

        {/* Option: Affiliate */}
        <button
          onClick={onAffiliateChoice}
          className="w-full p-6 rounded-2xl border border-[hsl(var(--auth-border)/0.1)] bg-[hsl(var(--auth-bg-elevated)/0.05)] hover:bg-[hsl(var(--auth-bg-elevated)/0.1)] hover:border-emerald-500/50 transition-all duration-300 text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/25">
              <Users className="w-6 h-6 text-[hsl(var(--auth-text-primary))]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-[hsl(var(--auth-text-primary))] text-lg">Quero ser afiliado</h3>
              <p className="text-sm text-[hsl(var(--auth-text-muted))]">
                Quero promover produtos de outros produtores e ganhar comissões.
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="text-center">
        <Link
          to="/auth"
          className="text-sm text-[hsl(var(--auth-text-muted))] hover:text-[hsl(var(--auth-text-primary))] transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao login
        </Link>
      </div>
    </motion.div>
  );
}
