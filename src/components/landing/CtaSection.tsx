import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-24 px-4 relative z-10 overflow-hidden">
      <div className="absolute inset-0 bg-blue-600/10" />
      <div className="container mx-auto max-w-4xl text-center relative z-20">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Pronto para aumentar suas vendas?
        </h2>
        <p className="text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
          Junte-se a milhares de infoprodutores que já usam o RiseCheckout para maximizar suas conversões.
        </p>
        <Link to="/auth">
          <Button size="lg" className="h-16 px-10 text-lg bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl shadow-blue-500/40 transition-all hover:scale-105">
            Criar minha conta grátis
          </Button>
        </Link>
      </div>
    </section>
  );
}
