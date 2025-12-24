import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Carlos Silva",
    role: "Infoprodutor",
    content: "O RiseCheckout transformou meu negócio. Aumentei minhas conversões em 40% no primeiro mês.",
    rating: 5,
    avatar: "CS"
  },
  {
    name: "Ana Beatriz",
    role: "Criadora de Conteúdo",
    content: "A melhor plataforma de checkout que já usei. O suporte é incrível e as funcionalidades são completas.",
    rating: 5,
    avatar: "AB"
  },
  {
    name: "Pedro Santos",
    role: "Empreendedor Digital",
    content: "Migrei da concorrência e não me arrependo. O builder visual é sensacional.",
    rating: 5,
    avatar: "PS"
  }
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 px-4 bg-white/5 relative z-10">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-6">O que nossos clientes dizem</h2>
          <p className="text-lg text-slate-400">
            Milhares de infoprodutores já transformaram seus negócios com o RiseCheckout.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-[#0A0A0B] border border-white/5 hover:border-blue-500/30 transition-all relative"
            >
              <div className="absolute top-8 right-8 text-blue-500/20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" />
                </svg>
              </div>
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                ))}
              </div>
              <p className="text-slate-300 mb-6 italic relative z-10">"{t.content}"</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-white">{t.name}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
