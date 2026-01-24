import { Mail, Phone, Globe } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="py-16 px-4 border-t border-[hsl(var(--landing-border)/0.05)] bg-[hsl(var(--landing-bg-footer))] relative z-10">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-5 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--landing-accent))] flex items-center justify-center">
                <span className="font-bold text-[hsl(var(--landing-text-primary))]">R</span>
              </div>
              <span className="font-bold text-xl text-[hsl(var(--landing-text-primary))]">RiseCheckout</span>
            </div>
            <p className="text-[hsl(var(--landing-text-subtle))] mb-6 max-w-xs">
              A plataforma de checkout mais completa para infoprodutores e empreendedores digitais.
            </p>
            <div className="text-xs text-[hsl(var(--landing-text-subtle)/0.7)]">
              © 2025 RiseCheckout. <br />Todos os direitos reservados.
            </div>
          </div>

          <div>
            <h4 className="font-bold text-[hsl(var(--landing-text-primary))] mb-6">Produto</h4>
            <ul className="space-y-4 text-sm text-[hsl(var(--landing-text-muted))]">
              <li><a href="#" className="hover:text-[hsl(var(--landing-accent-hover))] transition-colors">Funcionalidades</a></li>
              <li><a href="#" className="hover:text-[hsl(var(--landing-accent-hover))] transition-colors">Conversão</a></li>
              <li><a href="#" className="hover:text-[hsl(var(--landing-accent-hover))] transition-colors">Integrações</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[hsl(var(--landing-text-primary))] mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-[hsl(var(--landing-text-muted))]">
              <li><a href="/termos-de-uso" className="hover:text-[hsl(var(--landing-accent-hover))] transition-colors">Termos de Uso</a></li>
              <li><a href="/politica-de-privacidade" className="hover:text-[hsl(var(--landing-accent-hover))] transition-colors">Política de Privacidade</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[hsl(var(--landing-text-primary))] mb-6">Contato</h4>
            <ul className="space-y-4 text-sm text-[hsl(var(--landing-text-muted))]">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[hsl(var(--landing-accent))]" />
                suporte@risecheckout.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[hsl(var(--landing-accent))]" />
                (61) 9871-8100
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[hsl(var(--landing-accent))]" />
                Luziânia, GO - Brasil
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
