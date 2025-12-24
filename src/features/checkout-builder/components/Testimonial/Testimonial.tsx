/**
 * Testimonial - Componente "Burro" de UI
 * 
 * Responsabilidade: Apenas renderizar um depoimento de cliente.
 * NÃO conhece sobre: layout, posicionamento, design global, etc.
 * 
 * Princípio aplicado: Separação de Responsabilidades (Vibe Coding)
 */

export interface TestimonialProps {
  // Conteúdo
  testimonialText: string;
  authorName: string;
  authorImage?: string;
  
  // Configurações visuais
  backgroundColor: string;
  textColor: string;
  authorColor: string;
  
  // Eventos
  onClick?: () => void;
  
  // Classes adicionais (para drag-and-drop, etc.)
  className?: string;
}

export const Testimonial = ({
  testimonialText,
  authorName,
  authorImage,
  backgroundColor,
  textColor,
  authorColor,
  onClick,
  className = '',
}: TestimonialProps) => {
  return (
    <div 
      className={`p-6 rounded-lg ${className}`}
      onClick={onClick}
      style={{ backgroundColor }}
    >
      <div className="flex gap-4">
        {authorImage && (
          <img 
            src={authorImage} 
            alt={authorName} 
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1">
          <p 
            className="italic mb-2"
            style={{ color: textColor }}
          >
            "{testimonialText}"
          </p>
          <p 
            className="text-sm font-semibold"
            style={{ color: authorColor }}
          >
            - {authorName}
          </p>
        </div>
      </div>
    </div>
  );
};
