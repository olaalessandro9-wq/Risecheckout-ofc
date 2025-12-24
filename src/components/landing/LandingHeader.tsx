import { Link } from "react-router-dom";
import { motion, MotionValue } from "framer-motion";
import { Button } from "@/components/ui/button";

interface LandingHeaderProps {
  headerOpacity: MotionValue<number>;
  headerY: MotionValue<number>;
}

export function LandingHeader({ headerOpacity, headerY }: LandingHeaderProps) {
  return (
    <motion.header
      style={{ opacity: headerOpacity, y: headerY }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5"
    >
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="font-bold text-white text-xl">R</span>
          </div>
          <span className="font-bold text-xl text-white tracking-tight">RiseCheckout</span>
        </div>
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
          <a href="#integrations" className="hover:text-white transition-colors">Integrações</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Depoimentos</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5">
              Entrar
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
              Começar grátis
            </Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
