/**
 * BusyProvider - Modal Global de Loading
 * 
 * RISE Protocol V3 Compliant - Design Tokens
 * Usa sistema --auth-* para consistência visual
 */

import React, { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Loader2, Copy, Trash2, Save, Upload, Download } from "lucide-react";

type BusyState = { visible: boolean; message?: string };
type BusyApi = {
  show: (message?: string) => void;
  hide: () => void;
  run: <T>(fn: () => Promise<T>, message?: string) => Promise<T>;
};

const BusyCtx = createContext<BusyApi | null>(null);

export function useBusy() {
  const ctx = useContext(BusyCtx);
  if (!ctx) throw new Error("useBusy must be used within <BusyProvider>");
  return ctx;
}

// Função para determinar o ícone baseado na mensagem
function getIconForMessage(message?: string) {
  if (!message) return <Loader2 className="w-6 h-6 text-[hsl(var(--auth-accent))]" />;
  
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('duplicando')) {
    return <Copy className="w-6 h-6 text-[hsl(var(--auth-accent))]" />;
  }
  if (lowerMessage.includes('excluindo') || lowerMessage.includes('deletando')) {
    return <Trash2 className="w-6 h-6 text-red-500" />;
  }
  if (lowerMessage.includes('salvando') || lowerMessage.includes('criando')) {
    return <Save className="w-6 h-6 text-green-500" />;
  }
  if (lowerMessage.includes('enviando') || lowerMessage.includes('upload')) {
    return <Upload className="w-6 h-6 text-[hsl(var(--auth-accent-secondary))]" />;
  }
  if (lowerMessage.includes('baixando') || lowerMessage.includes('download')) {
    return <Download className="w-6 h-6 text-[hsl(var(--info))]" />;
  }
  
  return <Loader2 className="w-6 h-6 text-[hsl(var(--auth-accent))]" />;
}

// Função para obter descrição adicional baseada na mensagem
function getDescriptionForMessage(message?: string) {
  if (!message) return "Aguarde enquanto processamos sua solicitação...";
  
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('duplicando')) {
    return "Criando uma cópia completa do produto com todos os checkouts e configurações...";
  }
  if (lowerMessage.includes('excluindo') || lowerMessage.includes('deletando')) {
    return "Removendo o produto e desativando todos os checkouts associados...";
  }
  if (lowerMessage.includes('salvando')) {
    return "Salvando suas alterações no banco de dados...";
  }
  if (lowerMessage.includes('criando')) {
    return "Criando novo registro no sistema...";
  }
  
  return "Aguarde enquanto processamos sua solicitação...";
}

export function BusyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BusyState>({ visible: false });

  const api: BusyApi = {
    show: (message) => setState({ visible: true, message }),
    hide: () => setState({ visible: false }),
    run: async (fn, message) => {
      setState({ visible: true, message });
      try {
        const res = await fn();
        return res;
      } finally {
        setState({ visible: false });
      }
    },
  };

  return (
    <BusyCtx.Provider value={api}>
      {children}
      {state.visible &&
        createPortal(
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Card minimalista */}
            <div className="bg-[hsl(var(--auth-bg))] rounded-2xl p-8 shadow-2xl w-[380px] border border-[hsl(var(--auth-border)/0.1)]">
              {/* Ícone */}
              <div className="flex justify-center mb-5">
                <div className="bg-[hsl(var(--auth-bg-elevated)/0.1)] rounded-full p-4 border border-[hsl(var(--auth-border)/0.1)]">
                  <div className="animate-spin">
                    {getIconForMessage(state.message)}
                  </div>
                </div>
              </div>

              {/* Título */}
              <h3 className="text-lg font-semibold text-[hsl(var(--auth-text-primary))] text-center mb-3">
                {state.message ?? "Processando..."}
              </h3>

              {/* Descrição */}
              <p className="text-sm text-[hsl(var(--auth-text-muted))] text-center leading-relaxed mb-5">
                {getDescriptionForMessage(state.message)}
              </p>

              {/* Barra de progresso minimalista */}
              <div className="relative h-1 bg-[hsl(var(--auth-border)/0.2)] rounded-full overflow-hidden">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-green-500 to-[hsl(var(--auth-accent))] rounded-full"
                  style={{
                    animation: 'progress 1.5s ease-in-out infinite'
                  }}
                />
              </div>

              {/* Texto de rodapé */}
              <p className="text-xs text-[hsl(var(--auth-text-subtle))] text-center mt-4">
                Por favor, não feche esta janela
              </p>
            </div>
          </div>,
          document.body
        )}
      
      {/* Animação da barra de progresso */}
      <style>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </BusyCtx.Provider>
  );
}
