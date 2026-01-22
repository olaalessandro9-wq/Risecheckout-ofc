/**
 * PixErrorState - Componente para estado de erro na página PIX
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Exibe mensagem de erro amigável com opção de ação.
 * 
 * @module pix-payment/components
 */

import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PixErrorStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  showRetry?: boolean;
  onRetry?: () => void;
}

export function PixErrorState({
  message,
  actionLabel = "Voltar ao checkout",
  onAction,
  showRetry = false,
  onRetry,
}: PixErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Ícone de erro */}
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-600" />
      </div>

      {/* Título */}
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Ops! Algo deu errado
      </h2>

      {/* Mensagem */}
      <p className="text-gray-600 mb-8 max-w-md">
        {message}
      </p>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        {showRetry && onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </Button>
        )}
        
        {onAction && (
          <Button
            onClick={onAction}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {actionLabel}
          </Button>
        )}
      </div>

      {/* Informação adicional */}
      <p className="text-sm text-gray-400 mt-8">
        Se o problema persistir, entre em contato com o suporte.
      </p>
    </div>
  );
}
