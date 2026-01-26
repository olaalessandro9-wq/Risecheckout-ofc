/**
 * BadgeBlock - Componente "Burro" de UI
 * 
 * Responsabilidade: Apenas renderizar um selo/badge em formato de escudo.
 * NÃO conhece sobre: layout global, posicionamento, design system, etc.
 * 
 * Princípio aplicado: Separação de Responsabilidades (Vibe Coding)
 * 
 * Nota: Este componente era chamado de "seal" na versão anterior.
 */

export interface BadgeBlockProps {
  // Conteúdo
  topText: string;
  title: string;
  subtitle: string;
  
  // Configurações visuais
  primaryColor: string;
  titleColor: string;
  alignment: 'left' | 'center' | 'right';
  darkMode: boolean;
  
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

export const BadgeBlock = ({
  topText,
  title,
  subtitle,
  primaryColor,
  titleColor,
  alignment,
  darkMode,
  onClick,
  className = '',
}: BadgeBlockProps) => {
  return (
    <div 
      className={`p-6 rounded-lg flex items-center ${getAlignmentClass(alignment)} ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: darkMode ? "#1F2937" : "transparent",
      }}
    >
      <div className="relative">
        {/* Escudo superior */}
        <div 
          className="relative w-32 h-24 flex flex-col items-center justify-center rounded-t-full"
          style={{ 
            backgroundColor: "#FFFFFF",
            border: `3px solid ${primaryColor}`,
            borderBottom: "none",
          }}
        >
          {/* Ícone/Texto superior */}
          <div className="text-sm font-bold" style={{ color: primaryColor }}>
            {topText}
          </div>
        </div>
        
        {/* Fita central */}
        <div 
          className="relative w-32 h-12 flex items-center justify-center"
          style={{ backgroundColor: primaryColor }}
        >
          <span className="text-lg font-bold text-center px-2" style={{ color: titleColor }}>
            {title}
          </span>
        </div>
        
        {/* Escudo inferior */}
        <div 
          className="relative w-32 h-16 flex items-center justify-center"
          style={{ 
            backgroundColor: "#FFFFFF",
            border: `3px solid ${primaryColor}`,
            borderTop: "none",
            clipPath: "polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)",
          }}
        >
          <span className="text-xs font-semibold text-center px-2" style={{ color: primaryColor }}>
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  );
};
