import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Palette, CreditCard, Zap, ArrowRight, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bg: string;
}

const mainFeatures: Feature[] = [
  {
    icon: Users,
    title: "Programa de Afiliados",
    description: "Sistema completo para gerenciar afiliados, comissões e pagamentos automaticamente.",
    color: "text-[hsl(var(--landing-accent))]",
    bg: "bg-[hsl(var(--landing-accent)/0.1)]"
  },
  {
    icon: Palette,
    title: "Builder Visual",
    description: "Personalize cada detalhe do seu checkout com nosso editor drag-and-drop intuitivo.",
    color: "text-[hsl(var(--landing-purple))]",
    bg: "bg-[hsl(var(--landing-purple)/0.1)]"
  },
  {
    icon: CreditCard,
    title: "Múltiplos Gateways",
    description: "Stripe, Mercado Pago, Pushinpay e muito mais. Aceite pagamentos de qualquer lugar do mundo.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-32 px-4 relative z-10 bg-[hsl(var(--landing-bg))]">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--landing-accent)/0.1)] border border-[hsl(var(--landing-accent)/0.2)] text-[hsl(var(--landing-accent-hover))] text-sm font-medium mb-8">
              <Zap className="w-4 h-4 fill-[hsl(var(--landing-accent-hover))]" />
              <span>Funcionalidades</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-[hsl(var(--landing-text-primary))] mb-6 tracking-tight leading-tight">
              Tudo que você precisa para <br />
              <span className="text-[hsl(var(--landing-accent))]">vender online</span>
            </h2>

            <p className="text-lg text-[hsl(var(--landing-text-muted))] max-w-lg leading-relaxed mb-8">
              Ferramentas profissionais desenvolvidas para maximizar suas conversões e simplificar sua operação diária. O RiseCheckout cuida da tecnologia para você focar nas vendas.
            </p>

            <Link to="/auth">
              <Button className="bg-[hsl(var(--landing-accent))] hover:bg-[hsl(var(--landing-accent-hover))] text-[hsl(var(--landing-text-primary))] rounded-full px-8 h-12 shadow-lg shadow-[hsl(var(--landing-accent-glow)/0.2)] transition-all hover:scale-105">
                Conhecer funcionalidades <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Right Column: Feature List */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="flex flex-col gap-6"
          >
            {mainFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-[hsl(var(--landing-bg-subtle)/0.05)] transition-colors duration-300 group"
              >
                <div className={`mt-1 w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${feature.bg} flex items-center justify-center shadow-inner ring-1 ring-[hsl(var(--landing-border)/0.05)] group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[hsl(var(--landing-text-primary))] mb-2 group-hover:text-[hsl(var(--landing-accent-hover))] transition-colors">{feature.title}</h3>
                  <p className="text-[hsl(var(--landing-text-muted))] leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
