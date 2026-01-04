/**
 * ModuleCardPreview - Preview do card de módulo estilo Netflix
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
  title,
  imageUrl,
  lessonsCount = 0,
  className,
}: ModuleCardPreviewProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium text-muted-foreground">Pré-visualização</p>
      
      <div className="flex justify-center">
        <div className="relative w-40 aspect-[2/3] rounded-lg overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-xl">
          {/* Image or Placeholder */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title || "Preview do módulo"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-zinc-600">
                <Film className="h-10 w-10" />
                <span className="text-xs">Sem imagem</span>
              </div>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          {/* Lessons Badge */}
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-black/60 text-white backdrop-blur-sm">
              {lessonsCount} Aula{lessonsCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          {/* Title at bottom */}
          {title && (
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white text-sm font-medium line-clamp-2 leading-tight">
                {title}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-center text-xs text-muted-foreground">
        Visualização do card do módulo
      </p>
    </div>
  );
}
