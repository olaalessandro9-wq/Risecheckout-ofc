/**
 * VideoEmbed - Componente "Burro" de UI
 * 
 * Responsabilidade: Apenas renderizar um vídeo embed (YouTube, Vimeo, etc.).
 * NÃO conhece sobre: layout, posicionamento, design global, etc.
 * 
 * Princípio aplicado: Separação de Responsabilidades (Vibe Coding)
 */

export interface VideoEmbedProps {
  // Conteúdo
  videoUrl: string;
  videoType: 'youtube' | 'vimeo' | 'other';
  
  // Configurações visuais
  backgroundColor: string;
  placeholderColor: string;
  placeholderText?: string;
  
  // Eventos
  onClick?: () => void;
  
  // Classes adicionais (para drag-and-drop, etc.)
  className?: string;
}

/**
 * Converte URL do YouTube/Vimeo para URL de embed
 */
const getEmbedUrl = (url: string, type: string): string => {
  if (!url) return "";
  
  if (type === "youtube") {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  } else if (type === "vimeo") {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : "";
  }
  return url;
};

export const VideoEmbed = ({
  videoUrl,
  videoType,
  backgroundColor,
  placeholderColor,
  placeholderText = "Vídeo - Clique para configurar",
  onClick,
  className = '',
}: VideoEmbedProps) => {
  const embedUrl = getEmbedUrl(videoUrl, videoType);

  return (
    <div 
      className={`p-4 rounded-lg ${className}`}
      onClick={onClick}
      style={{ backgroundColor }}
    >
      {embedUrl ? (
        <div className="aspect-video w-full">
          <iframe
            src={embedUrl}
            className="w-full h-full rounded"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video embed"
          />
        </div>
      ) : (
        <div 
          className="aspect-video w-full flex items-center justify-center border-2 border-dashed rounded"
          style={{ borderColor: placeholderColor }}
        >
          <p 
            className="text-sm"
            style={{ color: placeholderColor }}
          >
            {placeholderText}
          </p>
        </div>
      )}
    </div>
  );
};
