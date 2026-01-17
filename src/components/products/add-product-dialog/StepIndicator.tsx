/**
 * Step Indicator Component
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Componente Puro
 */

interface StepIndicatorProps {
  currentStep: 1 | 2;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      <div className={`h-2 w-16 rounded-full transition-colors ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
      <div className={`h-2 w-16 rounded-full transition-colors ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
    </div>
  );
}
