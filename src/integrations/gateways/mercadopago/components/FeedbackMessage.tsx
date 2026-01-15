/**
 * FeedbackMessage Component
 * 
 * Exibe mensagens de feedback (sucesso/erro).
 */

import { CheckCircle2, AlertCircle } from 'lucide-react';

interface FeedbackMessageProps {
  message: { type: 'success' | 'error'; text: string } | null;
}

export function FeedbackMessage({ message }: FeedbackMessageProps) {
  if (!message) return null;

  const isSuccess = message.type === 'success';

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border-2 mt-6 animate-in fade-in duration-300 ${
        isSuccess
          ? 'bg-green-500/10 border-green-500/50'
          : 'bg-red-500/10 border-red-500/50'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
      ) : (
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
      )}
      <p className="text-sm" style={{ color: 'var(--text)' }}>
        {message.text}
      </p>
    </div>
  );
}
