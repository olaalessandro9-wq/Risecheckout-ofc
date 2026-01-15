/**
 * FeedbackMessage - Exibe mensagens de feedback (sucesso, erro, info)
 */

import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface FeedbackMessageProps {
  message: {
    type: "success" | "error" | "info";
    text: string;
  } | null;
}

export function FeedbackMessage({ message }: FeedbackMessageProps) {
  if (!message) return null;

  const getStyles = () => {
    switch (message.type) {
      case "success":
        return "bg-green-500/10 border-green-500/50";
      case "info":
        return "bg-blue-500/10 border-blue-500/50";
      default:
        return "bg-red-500/10 border-red-500/50";
    }
  };

  const getIcon = () => {
    switch (message.type) {
      case "success":
        return (
          <div className="bg-green-500/20 rounded-lg p-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
        );
      case "info":
        return (
          <div className="bg-blue-500/20 rounded-lg p-2">
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          </div>
        );
      default:
        return (
          <div className="bg-red-500/20 rounded-lg p-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
        );
    }
  };

  return (
    <div
      className={`flex items-start gap-4 p-5 rounded-xl border-2 animate-in fade-in duration-300 ${getStyles()}`}
    >
      {getIcon()}
      <div className="flex-1">
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
          {message.text}
        </p>
        {message.type === "success" && (
          <p className="text-xs" style={{ color: 'var(--subtext)' }}>
            Configurações salvas às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}
