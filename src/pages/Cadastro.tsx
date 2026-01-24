/**
 * Cadastro - Unified registration page with profile quiz
 * Shows quiz first, then routes to appropriate flow
 * 
 * Refactored: Form logic extracted to ProducerRegistrationForm component
 * to prevent state loss when AnimatePresence triggers re-mounts.
 * 
 * @version 2.0.0 - Migrated to Design Tokens (RISE Protocol V3)
 */

import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ShoppingBag, 
  Package,
  CheckSquare,
  ArrowLeft,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProducerRegistrationForm } from "@/components/auth/ProducerRegistrationForm";
import { AuthThemeProvider } from "@/components/theme-providers";

type ViewType = "choose-profile" | "already-has-account" | "producer-form";

export default function Cadastro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const [view, setView] = useState<ViewType>("choose-profile");
  const [registrationSource, setRegistrationSource] = useState<"producer" | "affiliate">("producer");

  // Check URL param for direct access to producer/affiliate form
  useEffect(() => {
    const perfil = searchParams.get("perfil");
    if (perfil === "produtor") {
      setRegistrationSource("producer");
      setView("producer-form");
    } else if (perfil === "afiliado") {
      setRegistrationSource("affiliate");
      setView("producer-form");
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleBuyerChoice = () => {
    setView("already-has-account");
  };

  const handleProducerChoice = () => {
    setRegistrationSource("producer");
    setView("producer-form");
  };

  const handleAffiliateChoice = () => {
    setRegistrationSource("affiliate");
    setView("producer-form");
  };

  const handleBackToQuiz = () => {
    setView("choose-profile");
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <AuthThemeProvider>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-[hsl(var(--auth-accent))] animate-spin" />
        </div>
      </AuthThemeProvider>
    );
  }

  // Shared layout wrapper
  const PageLayout = ({ children }: { children: React.ReactNode }) => (
    <AuthThemeProvider>
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(var(--auth-accent)/0.1)] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(var(--auth-accent-secondary)/0.1)] blur-[120px]" />
      </div>

      <div className="w-full flex min-h-screen">
        {/* Left Panel - Visual Branding (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[hsl(var(--auth-bg-elevated)/0.05)] backdrop-blur-sm border-r border-[hsl(var(--auth-border)/0.05)] flex-col justify-between p-12">
          {/* Logo */}
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 w-fit hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] flex items-center justify-center shadow-lg shadow-[hsl(var(--auth-accent)/0.2)]">
                <span className="font-bold text-[hsl(var(--auth-text-primary))] text-xl">R</span>
              </div>
              <span className="font-bold text-xl text-[hsl(var(--auth-text-primary))] tracking-tight">RiseCheckout</span>
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
              <h2 className="text-4xl font-bold text-[hsl(var(--auth-text-primary))] leading-tight">
                {view === "producer-form" ? (
                  registrationSource === "affiliate" ? (
                    <>
                      Ganhe comissões <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                        promovendo produtos
                      </span>
                    </>
                  ) : (
                    <>
                      Comece a vender <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))]">
                        em menos de 5 minutos
                      </span>
                    </>
                  )
                ) : (
                  <>
                    Bem-vindo ao <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))]">
                      RiseCheckout
                    </span>
                  </>
                )}
              </h2>
              <p className="text-lg text-[hsl(var(--auth-text-muted))] leading-relaxed">
                {view === "producer-form" 
                  ? registrationSource === "affiliate"
                    ? "Cadastre-se gratuitamente e comece a promover produtos de sucesso."
                    : "Crie sua conta gratuitamente e junte-se a milhares de empreendedores que estão escalando suas vendas."
                  : "A plataforma completa para produtores e compradores de produtos digitais."
                }
              </p>
            </motion.div>
          </div>

          {/* Footer Copyright */}
          <div className="relative z-10 text-xs text-[hsl(var(--auth-text-subtle))]">
            © 2026 RiseCheckout Inc. Todos os direitos reservados.
          </div>
        </div>

        {/* Right Panel - Dynamic Content */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12 relative z-10">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] flex items-center justify-center">
                  <span className="font-bold text-[hsl(var(--auth-text-primary))]">R</span>
                </div>
                <span className="font-bold text-lg text-[hsl(var(--auth-text-primary))]">RiseCheckout</span>
              </Link>
            </div>

            {children}
          </div>
        </div>
      </div>
    </AuthThemeProvider>
  );

  // View: Choose Profile Quiz
  const ChooseProfileView = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
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
          onClick={handleBuyerChoice}
          className="w-full p-6 rounded-2xl border border-[hsl(var(--auth-border)/0.1)] bg-[hsl(var(--auth-bg-elevated)/0.05)] hover:bg-[hsl(var(--auth-bg-elevated)/0.1)] hover:border-[hsl(var(--auth-accent)/0.5)] transition-all duration-300 text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
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
          onClick={handleProducerChoice}
          className="w-full p-6 rounded-2xl border border-[hsl(var(--auth-border)/0.1)] bg-[hsl(var(--auth-bg-elevated)/0.05)] hover:bg-[hsl(var(--auth-bg-elevated)/0.1)] hover:border-[hsl(var(--auth-accent-secondary)/0.5)] transition-all duration-300 text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--auth-accent-secondary))] to-pink-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
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
          onClick={handleAffiliateChoice}
          className="w-full p-6 rounded-2xl border border-[hsl(var(--auth-border)/0.1)] bg-[hsl(var(--auth-bg-elevated)/0.05)] hover:bg-[hsl(var(--auth-bg-elevated)/0.1)] hover:border-emerald-500/50 transition-all duration-300 text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
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

  // View: Already Has Account (Braip Style)
  const AlreadyHasAccountView = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
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
          className="w-full h-12 bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] hover:opacity-90 transition-opacity text-[hsl(var(--auth-text-primary))] font-semibold rounded-xl text-base"
        >
          Criar nova senha
        </Button>

        <div className="text-center">
          <button
            onClick={handleBackToQuiz}
            className="text-sm text-[hsl(var(--auth-text-muted))] hover:text-[hsl(var(--auth-text-primary))] transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <PageLayout>
      <AnimatePresence mode="wait">
        {view === "choose-profile" && <ChooseProfileView key="choose" />}
        {view === "already-has-account" && <AlreadyHasAccountView key="already" />}
        {view === "producer-form" && (
          <ProducerRegistrationForm
            key="form"
            registrationSource={registrationSource}
            onBack={handleBackToQuiz}
          />
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
