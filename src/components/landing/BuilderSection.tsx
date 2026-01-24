import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const builderFeatures = [
  "Arraste e solte componentes livremente",
  "Temas claro, escuro e personalizados",
  "Preview em tempo real (Desktop e Mobile)",
  "Componentes de alta conversão pré-prontos"
];

export function BuilderSection() {
  return (
    <section className="py-24 px-4 relative z-10 overflow-hidden">
      <div className="container mx-auto max-w-6xl relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Visual Builder Mock */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1 relative"
          >
            <div className="relative bg-[hsl(var(--landing-bg-elevated))] border border-[hsl(var(--landing-border)/0.1)] rounded-2xl p-2 shadow-2xl">
              {/* Top Bar */}
              <div className="h-10 bg-[hsl(var(--landing-bg-subtle)/0.05)] rounded-t-xl flex items-center px-4 gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>

              <div className="flex gap-2 h-[350px]">
                {/* Sidebar components */}
                <div className="w-16 bg-[hsl(var(--landing-bg-subtle)/0.05)] rounded-lg flex flex-col gap-2 p-2 items-center">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded bg-[hsl(var(--landing-bg-subtle)/0.1)] hover:bg-[hsl(var(--landing-accent)/0.5)] transition-colors cursor-pointer" />
                  ))}
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-[hsl(var(--landing-bg-footer))] rounded-lg p-6 relative overflow-hidden group border border-[hsl(var(--landing-border)/0.05)]">
                  {/* Drag Ghost Element */}
                  <motion.div
                    animate={{ y: [0, 10, 0], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-[68%] left-0 right-0 mx-auto w-48 h-12 border-2 border-dashed border-[hsl(var(--landing-accent))] bg-[hsl(var(--landing-accent)/0.2)] rounded-lg flex items-center justify-center text-[hsl(var(--landing-text-secondary))] text-xs font-bold pointer-events-none z-20 backdrop-blur-sm"
                  >
                    SOLTE AQUI
                  </motion.div>

                  <div className="space-y-4 opacity-50 blur-[1px] group-hover:blur-0 transition-all duration-500">
                    <div className="h-8 w-3/4 bg-[hsl(var(--landing-bg-subtle)/0.1)] rounded" />
                    <div className="h-32 w-full bg-[hsl(var(--landing-bg-subtle)/0.1)] rounded" />
                    <div className="h-12 w-full bg-[hsl(var(--landing-accent)/0.2)] rounded border border-[hsl(var(--landing-accent)/0.3)]" />
                  </div>
                </div>

                {/* Properties Panel */}
                <div className="w-48 bg-[hsl(var(--landing-bg-subtle)/0.05)] rounded-lg p-3 space-y-3">
                  <div className="h-4 w-20 bg-[hsl(var(--landing-bg-subtle)/0.2)] rounded mb-4" />
                  <div className="space-y-2">
                    <div className="text-[10px] text-[hsl(var(--landing-text-subtle))] uppercase">Cores</div>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-[hsl(var(--landing-accent))] border-2 border-[hsl(var(--landing-text-primary))]" />
                      <div className="w-6 h-6 rounded-full bg-[hsl(var(--landing-purple))]" />
                      <div className="w-6 h-6 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-[hsl(var(--landing-border)/0.05)]">
                    <div className="text-[10px] text-[hsl(var(--landing-text-subtle))] uppercase">Layout</div>
                    <div className="h-2 w-full bg-[hsl(var(--landing-bg-subtle)/0.1)] rounded" />
                    <div className="h-2 w-2/3 bg-[hsl(var(--landing-bg-subtle)/0.1)] rounded" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <div className="inline-block px-3 py-1 rounded-full bg-[hsl(var(--landing-purple)/0.2)] text-purple-400 font-semibold text-sm mb-6">
              Builder Visual
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[hsl(var(--landing-text-primary))] mb-6">
              Crie checkouts únicos <span className="text-[hsl(var(--landing-purple))]">sem código</span>
            </h2>
            <p className="text-lg text-[hsl(var(--landing-text-muted))] mb-8 leading-relaxed">
              Nosso builder drag-and-drop permite que você personalize cada detalhe.
              Cores, fontes, textos e componentes — crie uma experiência de marca única em segundos.
            </p>

            <ul className="space-y-4">
              {builderFeatures.map((item, i) => (
                <motion.li
                  key={i}
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 text-[hsl(var(--landing-text-secondary))]"
                >
                  <div className="w-6 h-6 rounded-full bg-[hsl(var(--landing-purple)/0.2)] flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  </div>
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
