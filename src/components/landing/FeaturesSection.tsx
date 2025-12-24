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
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    icon: Palette,
    title: "Builder Visual",
    description: "Personalize cada detalhe do seu checkout com nosso editor drag-and-drop intuitivo.",
    color: "text-purple-500",
    bg: "bg-purple-500/10"
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
    <section id="features" className="py-32 px-4 relative z-10 bg-[#0A0A0B]">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
              <Zap className="w-4 h-4 fill-blue-400" />
              <span>Funcionalidades</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
              Tudo que você precisa para <br />
              <span className="text-blue-500">vender online</span>
            </h2>

            <p className="text-lg text-slate-400 max-w-lg leading-relaxed mb-8">
              Ferramentas profissionais desenvolvidas para maximizar suas conversões e simplificar sua operação diária. O RiseCheckout cuida da tecnologia para você focar nas vendas.
            </p>

            <Link to="/auth">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-12 shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
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
                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors duration-300 group"
              >
                <div className={`mt-1 w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${feature.bg.replace('/10', '/20')} flex items-center justify-center shadow-inner ring-1 ring-white/5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">
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
