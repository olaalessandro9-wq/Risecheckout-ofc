/**
 * CadastroLayout - Layout wrapper para página de cadastro
 * 
 * RISE ARCHITECT PROTOCOL V3 - Module-scope component (referência estável)
 * 
 * Inclui:
 * - AuthThemeProvider (tema escuro)
 * - Background glows
 * - Two-panel layout (form left, branding right)
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthThemeProvider } from "@/components/theme-providers";
import { RiseLogo } from "@/components/brand/RiseLogo";
import { brandingVariants } from "../motion";

type ViewType = "choose-profile" | "already-has-account" | "producer-form";

interface CadastroLayoutProps {
  children: React.ReactNode;
  view: ViewType;
  registrationSource: "producer" | "affiliate";
}

export function CadastroLayout({ children, view, registrationSource }: CadastroLayoutProps) {
  return (
    <AuthThemeProvider>
      {/* Background Elements - Blue Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(var(--auth-accent)/0.08)] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(var(--auth-accent-secondary)/0.08)] blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-[hsl(var(--auth-accent-tertiary)/0.05)] blur-[100px]" />
      </div>

      <div className="w-full flex min-h-screen">
        {/* Left Panel - Dynamic Content (INVERTED) */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12 lg:w-1/2 lg:border-r lg:border-[hsl(var(--auth-border)/0.05)] relative z-10">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Link to="/" className="flex items-center gap-2">
                <RiseLogo size="sm" variant="auth" />
                <span className="font-bold text-lg text-[hsl(var(--auth-text-primary))]">RiseCheckout</span>
              </Link>
            </div>

            {children}
          </div>
        </div>

        {/* Right Panel - Visual Branding (Desktop Only) (INVERTED) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[hsl(var(--auth-bg-elevated)/0.03)] backdrop-blur-sm flex-col justify-between p-12">
          {/* Logo */}
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 w-fit hover:opacity-80 transition-opacity">
              <RiseLogo size="md" variant="auth" />
              <span className="font-bold text-xl text-[hsl(var(--auth-text-primary))] tracking-tight">RiseCheckout</span>
            </Link>
          </div>

          {/* Feature Highlight */}
          <div className="relative z-10 max-w-lg">
            <motion.div
              variants={brandingVariants}
              initial="initial"
              animate="animate"
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
      </div>
    </AuthThemeProvider>
  );
}
