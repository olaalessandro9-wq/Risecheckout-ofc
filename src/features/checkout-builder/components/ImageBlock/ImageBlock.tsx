/**
 * ImageBlock - Componente "Burro" de UI
 * 
 * Responsabilidade: Apenas renderizar uma imagem com configurações de alinhamento e tamanho.
 * NÃO conhece sobre: layout global, posicionamento, design system, etc.
 * 
 * Princípio aplicado: Separação de Responsabilidades (Vibe Coding)
 */

export interface ImageBlockProps {
  // Conteúdo
  imageUrl: string;
  alt: string;
  
  // Configurações visuais
  alignment: 'left' | 'center' | 'right';
  maxWidth: number;
  roundedImage: boolean;
  
  // Eventos
  onClick?: () => void;
  
  // Classes adicionais (para drag-and-drop, etc.)
  className?: string;
}

const getAlignmentClass = (alignment: 'left' | 'center' | 'right'): string => {
  if (alignment === "left") return "justify-start";
  if (alignment === "right") return "justify-end";
  return "justify-center";
};

export const ImageBlock = ({
  imageUrl,
  alt,
  alignment,
  maxWidth,
  roundedImage,
  onClick,
  className = '',
}: ImageBlockProps) => {
  return (
    <div 
      className={`flex items-center ${getAlignmentClass(alignment)} ${className}`}
      onClick={onClick}
      style={{ 
        minHeight: imageUrl ? "auto" : "128px",
        backgroundColor: "transparent",
      }}
    >
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={alt} 
          className={roundedImage ? "rounded-lg object-contain" : "object-contain"}
          style={{
            maxWidth: `${maxWidth}px`,
            maxHeight: '600px', // Aumentado para permitir banners mais altos
            width: '100%',
            height: 'auto',
          }}
        />
      ) : (
        <div className="border-2 border-dashed border-[hsl(var(--checkout-input-border))] rounded-lg p-8 text-center w-full flex flex-col items-center gap-2">
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="hsl(var(--checkout-placeholder-icon))" 
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <p className="text-sm text-muted-foreground">
            Nenhuma imagem selecionada
          </p>
          <p className="text-xs text-muted-foreground/70">
            Clique para adicionar uma imagem
          </p>
        </div>
      )}
    </div>
  );
};
