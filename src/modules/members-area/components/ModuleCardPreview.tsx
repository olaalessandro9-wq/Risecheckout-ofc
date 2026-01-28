/**
 * ModuleCardPreview - Preview GRANDE do card de módulo estilo Netflix/Kiwify
 * Suporta tamanhos: md, lg, xl para diferentes contextos
 */

import { cn } from "@/lib/utils";
import { Film } from "lucide-react";

type PreviewSize = "md" | "lg" | "xl";

interface ModuleCardPreviewProps {
  title?: string;
  imageUrl?: string | null;
  lessonsCount?: number;
  size?: PreviewSize;
  className?: string;
}

const sizeConfig: Record<PreviewSize, { wrapper: string; icon: string; badge: string; text: string }> = {
  md: {
    wrapper: "max-w-[180px]",
    icon: "h-12 w-12",
    badge: "px-2 py-0.5 text-xs",
    text: "text-xs",
  },
  lg: {
    wrapper: "max-w-[240px]",
    icon: "h-16 w-16",
    badge: "px-2.5 py-1 text-xs",
    text: "text-sm",
  },
  xl: {
    wrapper: "max-w-[320px]",
    icon: "h-20 w-20",
    badge: "px-3 py-1.5 text-sm",
    text: "text-sm",
  },
};

export function ModuleCardPreview({
  imageUrl,
  lessonsCount = 0,
  size = "lg",
  className,
}: ModuleCardPreviewProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn("w-full", config.wrapper, className)}>
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-lg ring-1 ring-white/10">
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
              <Film className={config.icon} />
              <span className={config.text}>Sem imagem</span>
            </div>
          </div>
        )}
        
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Lessons Badge - top right like Kiwify */}
        <div className="absolute top-3 right-3">
          <span className={cn(
            "inline-flex items-center rounded-md font-semibold bg-black/70 text-white backdrop-blur-sm",
            config.badge
          )}>
            {lessonsCount} Aula{lessonsCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
