import { Mail, Phone, Globe } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="py-16 px-4 border-t border-white/5 bg-[#050506] relative z-10">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-5 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="font-bold text-white">R</span>
              </div>
              <span className="font-bold text-xl text-white">RiseCheckout</span>
            </div>
            <p className="text-slate-500 mb-6 max-w-xs">
              A plataforma de checkout mais completa para infoprodutores e empreendedores digitais.
            </p>
            <div className="text-xs text-slate-600">
              © 2025 RiseCheckout. <br />Todos os direitos reservados.
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Produto</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Funcionalidades</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Conversão</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Integrações</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="/termos-de-uso" className="hover:text-blue-400 transition-colors">Termos de Uso</a></li>
              <li><a href="/politica-de-privacidade" className="hover:text-blue-400 transition-colors">Política de Privacidade</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Contato</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" />
                suporte@risecheckout.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-500" />
                (61) 9871-8100
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                Luziânia, GO - Brasil
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
