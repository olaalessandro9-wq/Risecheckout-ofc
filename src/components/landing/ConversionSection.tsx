import { motion } from "framer-motion";
import { Gift, MousePointerClick, RefreshCw, Percent, CheckCircle2, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConversionFeature {
  title: string;
  desc: string;
  val: string;
  icon: LucideIcon;
}

const conversionFeatures: ConversionFeature[] = [
  { title: "Order Bumps", desc: "Ofertas complementares no checkout", val: "+30%", icon: Gift },
  { title: "1-Click Upsell", desc: "Venda extra sem digitar dados", val: "+25%", icon: MousePointerClick },
  { title: "Recuperação de Vendas", desc: "E-mails automáticos para carrinhos", val: "+40%", icon: RefreshCw },
  { title: "Cupons Inteligentes", desc: "Regras avançadas de desconto", val: "+15%", icon: Percent }
];

export function ConversionSection() {
  return (
    <section className="py-24 px-4 bg-[hsl(var(--landing-bg-subtle)/0.05)] relative z-10">
      <div className="absolute inset-0 bg-[hsl(var(--landing-accent)/0.05)] pointer-events-none" />
      <div className="container mx-auto max-w-6xl relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-block px-3 py-1 rounded-full bg-[hsl(var(--landing-accent)/0.2)] text-[hsl(var(--landing-accent-hover))] font-semibold text-sm mb-6">
              Maximize suas vendas
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[hsl(var(--landing-text-primary))] mb-6 leading-tight">
              Aumente seu faturamento com <span className="text-[hsl(var(--landing-accent))]">ferramentas de conversão</span>
            </h2>
            <p className="text-lg text-[hsl(var(--landing-text-muted))] mb-8 leading-relaxed">
              Não perca oportunidades. Utilize estratégias comprovadas para aumentar o ticket médio e recuperar vendas perdidas automaticamente.
            </p>

            <div className="space-y-4">
              {conversionFeatures.map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-[hsl(var(--landing-bg))] border border-[hsl(var(--landing-border)/0.05)] hover:border-[hsl(var(--landing-accent)/0.3)] transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-[hsl(var(--landing-accent)/0.1)] flex items-center justify-center text-[hsl(var(--landing-accent))]">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[hsl(var(--landing-text-primary))]">{item.title}</h4>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">{item.val}</span>
                    </div>
                    <p className="text-sm text-[hsl(var(--landing-text-subtle))]">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Visual Preview (Checkout Mock) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-[hsl(var(--landing-accent)/0.2)] blur-[100px] rounded-full" />

            <div className="relative bg-[hsl(var(--landing-bg))] border border-[hsl(var(--landing-border)/0.1)] rounded-2xl p-6 shadow-2xl shadow-black/50">
              {/* Header Mock */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[hsl(var(--landing-border)/0.05)]">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--landing-bg-elevated))]" />
                <div className="h-4 w-32 bg-[hsl(var(--landing-bg-elevated))] rounded" />
              </div>

              {/* Product Item */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[hsl(var(--landing-bg-subtle)/0.05)] border border-[hsl(var(--landing-border)/0.05)]">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-[hsl(var(--landing-text-primary))]">Curso Masterclass</div>
                      <div className="text-xs text-[hsl(var(--landing-text-muted))]">Produto Principal</div>
                    </div>
                    <div className="font-bold text-[hsl(var(--landing-text-primary))]">R$ 497,00</div>
                  </div>
                </div>

                {/* Order Bump Highlight */}
                <div className="p-4 rounded-xl bg-[hsl(var(--landing-accent)/0.1)] border border-[hsl(var(--landing-accent)/0.3)] relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 bg-[hsl(var(--landing-accent))] text-[10px] font-bold px-6 py-1 rotate-45 text-[hsl(var(--landing-text-primary))]">OFERTA</div>
                  <div className="flex gap-3">
                    <div className="mt-1">
                      <div className="w-5 h-5 rounded border-2 border-[hsl(var(--landing-accent))] bg-[hsl(var(--landing-accent))] flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-[hsl(var(--landing-text-primary))]" />
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-[hsl(var(--landing-text-primary))] text-sm">Levar também a Mentoria VIP?</div>
                      <div className="text-xs text-[hsl(var(--landing-text-muted))] mt-1 mb-2">Adicione acompanhamento exclusivo por apenas mais R$ 97,00.</div>
                      <div className="font-bold text-emerald-400 text-sm">+ R$ 97,00</div>
                    </div>
                  </div>
                </div>

                {/* Totals */}
                <div className="pt-4 mt-4 border-t border-[hsl(var(--landing-border)/0.05)] space-y-2">
                  <div className="flex justify-between text-sm text-[hsl(var(--landing-text-muted))]">
                    <span>Subtotal</span>
                    <span>R$ 594,00</span>
                  </div>
                  <div className="flex justify-between text-sm text-emerald-400 font-medium">
                    <span>Desconto (PIX)</span>
                    <span>- R$ 29,70</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-[hsl(var(--landing-text-primary))] mt-2">
                    <span>Total</span>
                    <span>R$ 564,30</span>
                  </div>
                </div>

                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-[hsl(var(--landing-text-primary))] font-bold h-12 rounded-xl shadow-lg shadow-emerald-500/20">
                  Pagar Agora
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
