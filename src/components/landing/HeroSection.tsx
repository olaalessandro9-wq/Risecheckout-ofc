import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-4 z-10 overflow-hidden">
      {/* Background Grid Pattern & Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[hsl(var(--landing-accent)/0.2)] blur-[100px] rounded-full opacity-30" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="container mx-auto max-w-6xl relative">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--landing-accent)/0.1)] border border-[hsl(var(--landing-accent)/0.2)] text-[hsl(var(--landing-accent-hover))] text-sm font-medium mb-8 backdrop-blur-sm shadow-lg shadow-[hsl(var(--landing-accent-glow)/0.1)]"
          >
            <Zap className="w-4 h-4 fill-[hsl(var(--landing-accent-hover))]" />
            <span className="text-[hsl(var(--landing-text-secondary))]">
              A plataforma de checkout mais completa do Brasil
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-[hsl(var(--landing-text-primary))] mb-8 leading-tight tracking-tight relative z-10"
          >
            Venda seus produtos digitais com <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--landing-gradient-start))] via-[hsl(var(--landing-gradient-mid))] to-[hsl(var(--landing-gradient-end))] animate-gradient-x pb-2">
              alta conversão
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-[hsl(var(--landing-text-muted))] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Checkout personalizável, múltiplos gateways de pagamento, order bumps,
            upsells e muito mais em uma única plataforma.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-0"
          >
            <Link to="/auth">
              <Button 
                size="lg" 
                className="h-14 px-8 text-base bg-[hsl(var(--landing-text-primary))] text-[hsl(var(--landing-bg))] hover:bg-[hsl(var(--landing-text-secondary))] rounded-full font-semibold transition-all hover:scale-105 shadow-xl shadow-[hsl(var(--landing-text-primary)/0.1)]"
              >
                Criar conta grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#features">
              <Button 
                size="lg" 
                variant="outline" 
                className="h-14 px-8 text-base bg-transparent border-[hsl(var(--landing-border)/0.1)] text-[hsl(var(--landing-text-primary))] hover:bg-[hsl(var(--landing-bg-subtle)/0.05)] hover:text-[hsl(var(--landing-text-primary))] rounded-full backdrop-blur-sm"
              >
                Ver funcionalidades
              </Button>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
