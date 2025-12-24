import { Construction } from "lucide-react";

interface EmBreveProps {
  titulo: string;
}

export default function EmBreve({ titulo }: EmBreveProps) {
  return (
    
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Construction className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          {titulo}
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Esta funcionalidade estará disponível em breve. Estamos trabalhando para trazer novidades incríveis!
        </p>
      </div>
    
  );
}
