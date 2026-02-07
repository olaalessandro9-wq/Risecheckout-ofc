/**
 * ResetPasswordLayout - Layout for password reset pages
 * 
 * @version 3.0.0 - Blue Theme + Inverted Layout (Form Left, Branding Right)
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { RiseLogo } from "@/components/brand/RiseLogo";
import type { ResetPasswordConfig } from "./types";

interface ResetPasswordLayoutProps {
  config: ResetPasswordConfig;
  children: React.ReactNode;
}

export function ResetPasswordLayout({ config, children }: ResetPasswordLayoutProps) {
  return (
    <div className="min-h-screen w-full flex bg-[hsl(var(--auth-bg))] text-[hsl(var(--auth-text-primary))] overflow-hidden relative">
      {/* Background Elements - Blue Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(var(--auth-accent)/0.08)] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(var(--auth-accent-secondary)/0.08)] blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-[hsl(var(--auth-accent-tertiary)/0.05)] blur-[100px]" />
      </div>

      <div className="w-full flex">
        {/* Left Panel - Form (INVERTED) */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12 lg:w-1/2 lg:border-r lg:border-[hsl(var(--auth-border)/0.05)] relative z-10">
          <div className="w-full max-w-md">
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-bold text-[hsl(var(--auth-text-primary))] leading-tight">
                Crie uma nova senha <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))]">
                  segura
                </span>
              </h2>
              <p className="text-lg text-[hsl(var(--auth-text-secondary))] leading-relaxed">
                Defina uma senha forte para proteger sua conta e continuar {config.brandDescription}.
              </p>
            </motion.div>
          </div>

          {/* Footer Copyright */}
          <div className="relative z-10 text-xs text-[hsl(var(--auth-text-muted))]">
            © 2026 RiseCheckout Inc. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  );
}
