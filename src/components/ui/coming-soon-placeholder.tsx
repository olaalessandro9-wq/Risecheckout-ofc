/**
 * ComingSoonPlaceholder - Placeholder reutilizável para funcionalidades em desenvolvimento
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Componente Reutilizável
 */

import { Construction } from "lucide-react";

interface ComingSoonPlaceholderProps {
  title: string;
  description?: string;
}

export function ComingSoonPlaceholder({ 
  title, 
  description = "Esta funcionalidade estará disponível em breve."
}: ComingSoonPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Construction className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{description}</p>
    </div>
  );
}
