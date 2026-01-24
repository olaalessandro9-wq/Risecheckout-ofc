import { motion } from "framer-motion";
import { CreditCard, Zap, Target, Layers, BarChart3, Users, CheckCircle2, LucideIcon } from "lucide-react";

interface Integration {
  name: string;
  category: string;
  icon: LucideIcon;
}

const integrations: Integration[] = [
  { name: "Mercado Pago", category: "Pagamentos", icon: CreditCard },
  { name: "Stripe", category: "Pagamentos", icon: CreditCard },
  { name: "PIX", category: "Pagamentos", icon: Zap },
  { name: "Facebook Pixel", category: "Marketing", icon: Target },
  { name: "UTMify", category: "Tracking", icon: Target },
  { name: "Webhooks", category: "Automação", icon: Layers },
  { name: "Google Analytics", category: "Analytics", icon: BarChart3 },
  { name: "Hotmart", category: "Afiliados", icon: Users }
];

export function IntegrationsSection() {
  return (
    <section id="integrations" className="py-24 px-4 bg-gradient-to-b from-transparent to-[hsl(var(--landing-accent)/0.05)] relative z-10">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-[hsl(var(--landing-text-primary))] mb-6">
              Conecte com suas <br />
              <span className="text-[hsl(var(--landing-accent))]">ferramentas favoritas</span>
            </h2>
            <p className="text-lg text-[hsl(var(--landing-text-muted))] mb-8 leading-relaxed">
              Integrações nativas com os principais gateways de pagamento e ferramentas de marketing.
              Não perca tempo com configurações complexas.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-[hsl(var(--landing-text-secondary))]">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Gateways de pagamento: Mercado Pago, Stripe, PIX</span>
              </div>
              <div className="flex items-center gap-3 text-[hsl(var(--landing-text-secondary))]">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Marketing: Facebook Pixel, Google Analytics</span>
              </div>
              <div className="flex items-center gap-3 text-[hsl(var(--landing-text-secondary))]">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Automação: Webhooks, UTMify</span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-[hsl(var(--landing-border)/0.1)]">
              <p className="text-sm text-[hsl(var(--landing-text-subtle))]">
                <span className="text-[hsl(var(--landing-text-primary))] font-medium">E muito mais integrações disponíveis</span>
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
          >
            {integrations.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-[hsl(var(--landing-bg-subtle)/0.05)] border border-[hsl(var(--landing-border)/0.05)] hover:border-[hsl(var(--landing-accent)/0.3)] hover:bg-[hsl(var(--landing-accent)/0.05)] transition-all text-center group"
              >
                <div className="w-10 h-10 mx-auto bg-[hsl(var(--landing-bg-subtle)/0.1)] rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <item.icon className="w-5 h-5 text-[hsl(var(--landing-text-secondary))] group-hover:text-[hsl(var(--landing-accent-hover))]" />
                </div>
                <div className="text-sm font-medium text-[hsl(var(--landing-text-primary))]">{item.name}</div>
                <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--landing-text-subtle))] mt-1">{item.category}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
