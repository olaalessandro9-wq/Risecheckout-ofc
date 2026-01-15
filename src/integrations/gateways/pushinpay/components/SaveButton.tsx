/**
 * SaveButton - Botão de salvar com estados de loading
 */

import { Loader2 } from 'lucide-react';

interface SaveButtonProps {
  onClick: () => void;
  loading: boolean;
  validatingToken: boolean;
  disabled: boolean;
}

export function SaveButton({
  onClick,
  loading,
  validatingToken,
  disabled,
}: SaveButtonProps) {
  const getButtonText = () => {
    if (validatingToken) return "Validando token...";
    if (loading) return "Salvando integração...";
    return "Salvar integração";
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
    >
      {(validatingToken || loading) && <Loader2 className="h-5 w-5 animate-spin" />}
      {getButtonText()}
    </button>
  );
}
