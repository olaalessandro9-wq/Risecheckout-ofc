import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-24 px-4 relative z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[hsl(var(--landing-accent)/0.1)]" />
      <div className="container mx-auto max-w-4xl text-center relative z-20">
        <h2 className="text-4xl md:text-5xl font-bold text-[hsl(var(--landing-text-primary))] mb-8">
          Pronto para aumentar suas vendas?
        </h2>
        <p className="text-xl text-[hsl(var(--landing-accent-hover)/0.8)] mb-10 max-w-2xl mx-auto">
          Junte-se a milhares de infoprodutores que já usam o RiseCheckout para maximizar suas conversões.
        </p>
        <Link to="/auth">
          <Button 
            size="lg" 
            className="h-16 px-10 text-lg bg-[hsl(var(--landing-accent))] hover:bg-[hsl(var(--landing-accent-hover))] text-[hsl(var(--landing-text-primary))] rounded-full shadow-2xl shadow-[hsl(var(--landing-accent-glow)/0.4)] transition-all hover:scale-105"
          >
            Criar minha conta grátis
          </Button>
        </Link>
      </div>
    </section>
  );
}
