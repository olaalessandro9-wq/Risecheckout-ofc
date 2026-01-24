import { motion } from "framer-motion";
import { Users, Palette, CreditCard, Rocket, LucideIcon } from "lucide-react";

interface Step {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const steps: Step[] = [
  {
    number: "01",
    title: "Crie sua conta",
    description: "Cadastro rápido e gratuito em menos de 1 minuto.",
    icon: Users
  },
  {
    number: "02",
    title: "Configure seu produto",
    description: "Adicione nome, preço e personalize seu checkout.",
    icon: Palette
  },
  {
    number: "03",
    title: "Conecte pagamentos",
    description: "Integre com nossos meios de pagamentos.",
    icon: CreditCard
  },
  {
    number: "04",
    title: "Comece a vender",
    description: "Compartilhe o link e receba pagamentos.",
    icon: Rocket
  }
];

export function StepsSection() {
  return (
    <section className="py-24 px-4 relative z-10">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-20">
          <span className="text-[hsl(var(--landing-accent))] font-semibold tracking-wider text-sm uppercase mb-4 block">Primeiros Passos</span>
          <h2 className="text-4xl font-bold text-[hsl(var(--landing-text-primary))] mb-6">Comece a vender em 4 passos</h2>
          <p className="text-[hsl(var(--landing-text-muted))]">Configure sua primeira venda em menos de 5 minutos.</p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-[hsl(var(--landing-accent)/0)] via-[hsl(var(--landing-accent)/0.2)] to-[hsl(var(--landing-accent)/0)] hidden md:block -translate-y-1/2 z-0" />

          <div className="grid md:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto bg-[hsl(var(--landing-bg))] border-2 border-[hsl(var(--landing-accent)/0.2)] rounded-full flex items-center justify-center mb-6 relative group hover:border-[hsl(var(--landing-accent))] transition-colors">
                  <step.icon className="w-8 h-8 text-[hsl(var(--landing-accent))] group-hover:scale-110 transition-transform" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-[hsl(var(--landing-accent))] rounded-full flex items-center justify-center text-[hsl(var(--landing-text-primary))] text-sm font-bold border-4 border-[hsl(var(--landing-bg))]">
                    {step.number}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[hsl(var(--landing-text-primary))] mb-2">{step.title}</h3>
                <p className="text-[hsl(var(--landing-text-muted))] text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
