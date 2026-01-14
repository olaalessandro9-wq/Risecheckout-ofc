/**
 * PixLoadingState - Estado de loading do pagamento PIX
 */

export function PixLoadingState() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
        <p className="text-white">Gerando código PIX...</p>
      </div>
    </div>
  );
}
