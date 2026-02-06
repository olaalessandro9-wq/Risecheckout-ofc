/**
 * LegalPageLayout - Shared layout for all legal pages
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Pure presentational component that receives content as props.
 * Handles: header, sticky sidebar, scroll-to-section, responsive layout.
 */

import { useRef, useCallback, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalPageLayoutProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  lastUpdated: string;
  sections: LegalSection[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LegalPageLayout({
  icon,
  title,
  subtitle,
  lastUpdated,
  sections,
}: LegalPageLayoutProps) {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/legal")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Documentos Legais
          </button>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {lastUpdated}
            </span>
            <a
              href="mailto:suporte@risecheckout.com"
              className="flex items-center gap-1.5 hover:text-slate-300 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              suporte@risecheckout.com
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8"
      >
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
            {subtitle && (
              <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Content grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex gap-8">
          {/* Sidebar */}
          <nav className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 space-y-1 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
                Índice
              </p>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "w-full text-left text-sm px-3 py-2 rounded-lg transition-all duration-200",
                    activeSection === section.id
                      ? "bg-emerald-500/10 text-emerald-400 font-medium"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  )}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </nav>

          {/* Main content */}
          <div ref={contentRef} className="flex-1 min-w-0">
            <div className="space-y-10">
              {sections.map((section) => (
                <motion.section
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="scroll-mt-28"
                >
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-1 h-5 bg-emerald-500 rounded-full" />
                      {section.title}
                    </h2>
                    <div className="text-sm text-slate-300 leading-relaxed space-y-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_strong]:text-white [&_a]:text-emerald-400 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-emerald-300 [&_table]:w-full [&_table]:text-left [&_th]:text-white [&_th]:font-medium [&_th]:pb-2 [&_th]:border-b [&_th]:border-white/10 [&_td]:py-2 [&_td]:border-b [&_td]:border-white/5">
                      {section.content}
                    </div>
                  </div>
                </motion.section>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-white/5 text-center">
              <p className="text-xs text-slate-500">
                Rise Community LTDA — CNPJ: 58.566.585/0001-91
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Rua 11, Quadra 257, N 5, Dalva 4, Luziânia/GO, CEP 72821-150
              </p>
              <Link
                to="/legal"
                className="inline-flex items-center gap-2 mt-4 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Ver todos os documentos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
