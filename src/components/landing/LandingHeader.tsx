import { Link } from "react-router-dom";
import { motion, MotionValue } from "framer-motion";
import { Button } from "@/components/ui/button";

interface LandingHeaderProps {
  headerOpacity: MotionValue<number>;
  headerY: MotionValue<number>;
}

export function LandingHeader({ headerOpacity, headerY }: LandingHeaderProps) {
  return (
    <motion.header
      style={{ opacity: headerOpacity, y: headerY }}
      className="fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--landing-bg)/0.8)] backdrop-blur-md border-b border-[hsl(var(--landing-border)/0.05)]"
    >
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--landing-accent))] to-[hsl(var(--landing-purple))] flex items-center justify-center shadow-lg shadow-[hsl(var(--landing-accent-glow)/0.2)]">
            <span className="font-bold text-[hsl(var(--landing-text-primary))] text-xl">R</span>
          </div>
          <span className="font-bold text-xl text-[hsl(var(--landing-text-primary))] tracking-tight">RiseCheckout</span>
        </div>
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[hsl(var(--landing-text-muted))]">
          <a href="#features" className="hover:text-[hsl(var(--landing-text-primary))] transition-colors">Funcionalidades</a>
          <a href="#integrations" className="hover:text-[hsl(var(--landing-text-primary))] transition-colors">Integrações</a>
          <a href="#testimonials" className="hover:text-[hsl(var(--landing-text-primary))] transition-colors">Depoimentos</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button 
              variant="ghost" 
              className="text-[hsl(var(--landing-text-muted))] hover:text-[hsl(var(--landing-text-primary))] hover:bg-[hsl(var(--landing-bg-subtle)/0.05)]"
            >
              Entrar
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-[hsl(var(--landing-accent))] hover:bg-[hsl(var(--landing-accent-hover))] text-[hsl(var(--landing-text-primary))] rounded-full px-6 shadow-lg shadow-[hsl(var(--landing-accent-glow)/0.2)] transition-all hover:scale-105">
              Começar grátis
            </Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
