/**
 * ModuleCardPreview - Preview GRANDE do card de módulo estilo Netflix/Kiwify
 */

import { cn } from "@/lib/utils";
import { Film } from "lucide-react";

interface ModuleCardPreviewProps {
  title?: string;
  imageUrl?: string | null;
  lessonsCount?: number;
  className?: string;
}

export function ModuleCardPreview({
  imageUrl,
  lessonsCount = 0,
  className,
}: ModuleCardPreviewProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium text-muted-foreground">Pré-visualização</p>
      
      <div className="flex justify-center">
        <div className="relative w-full max-w-[220px] aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-2xl ring-1 ring-white/10">
          {/* Image or Placeholder */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Preview do módulo"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-zinc-600">
                <Film className="h-16 w-16" />
                <span className="text-sm">Sem imagem</span>
              </div>
            </div>
          )}
          
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {/* Lessons Badge - top right like Kiwify */}
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-black/70 text-white backdrop-blur-sm">
              {lessonsCount} Aula{lessonsCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
