/**
 * PixLoadingState - Estado de loading do pagamento PIX
 */

export function PixLoadingState() {
  return (
    <div className="min-h-screen bg-[hsl(var(--payment-bg))] flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--payment-text-primary))]" />
        <p className="text-[hsl(var(--payment-text-primary))]">Gerando código PIX...</p>
      </div>
    </div>
  );
}
