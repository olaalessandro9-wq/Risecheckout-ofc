/**
 * LegalHub - Central page listing all legal documents
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  FileText,
  ShoppingCart,
  Shield,
  Cookie,
  RotateCcw,
  CreditCard,
  BookOpen,
  Scale,
} from "lucide-react";

// ============================================================================
// DOCUMENT REGISTRY
// ============================================================================

const LEGAL_DOCUMENTS = [
  {
    title: "Termos de Uso",
    description: "Regras de acesso e uso da plataforma RiseCheckout.",
    icon: FileText,
    href: "/termos-de-uso",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    title: "Termos de Compra",
    description: "Condições para compras realizadas via checkout.",
    icon: ShoppingCart,
    href: "/termos-de-compra",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    title: "Política de Privacidade",
    description: "Como coletamos, usamos e protegemos seus dados.",
    icon: Shield,
    href: "/politica-de-privacidade",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    title: "Política de Cookies",
    description: "Uso de cookies e tecnologias de rastreamento.",
    icon: Cookie,
    href: "/politica-de-cookies",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    title: "Política de Reembolso",
    description: "Como funciona o processo de reembolso.",
    icon: RotateCcw,
    href: "/politica-de-reembolso",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    title: "Política de Pagamentos",
    description: "Como os pagamentos são processados no checkout.",
    icon: CreditCard,
    href: "/politica-de-pagamentos",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    title: "Política de Conteúdo",
    description: "O que pode e não pode ser vendido na plataforma.",
    icon: BookOpen,
    href: "/politica-de-conteudo",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    title: "Política de Direitos Autorais",
    description: "Proteção de propriedade intelectual e denúncias.",
    icon: Scale,
    href: "/politica-de-direitos-autorais",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
] as const;

const LAST_UPDATED = "06 de fevereiro de 2026";

// ============================================================================
// COMPONENT
// ============================================================================

function LegalHub() {
  return (
    <>
      <Helmet>
        <title>Documentos Legais | RiseCheckout</title>
        <meta
          name="description"
          content="Termos de uso, políticas de privacidade, cookies, reembolso, pagamentos, conteúdo e direitos autorais do RiseCheckout."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-6">
              <Scale className="w-3.5 h-3.5" />
              Atualizado em {LAST_UPDATED}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Documentos Legais
            </h1>
            <p className="text-slate-400 max-w-lg mx-auto">
              Transparência é prioridade. Conheça todos os termos e políticas
              que regem o uso da plataforma RiseCheckout.
            </p>
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LEGAL_DOCUMENTS.map((doc, i) => {
              const Icon = doc.icon;
              return (
                <motion.div
                  key={doc.href}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={doc.href}
                    className="group flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all duration-300"
                  >
                    <div className={`p-2.5 rounded-xl ${doc.bg} shrink-0`}>
                      <Icon className={`w-5 h-5 ${doc.color}`} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {doc.title}
                      </h2>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {doc.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="text-center mt-16 space-y-2">
            <p className="text-xs text-slate-500">
              Rise Community LTDA — CNPJ: 58.566.585/0001-91
            </p>
            <p className="text-xs text-slate-600">
              suporte@risecheckout.com
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default LegalHub;
