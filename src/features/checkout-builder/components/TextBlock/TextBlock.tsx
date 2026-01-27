/**
 * TextBlock - Componente "Burro" de UI
 * 
 * Responsabilidade: Apenas renderizar um bloco de texto customizável.
 * NÃO conhece sobre: layout global, posicionamento, design system, etc.
 * 
 * Princípio aplicado: Separação de Responsabilidades (Vibe Coding)
 */

export interface TextBlockProps {
  // Conteúdo
  text: string;
  
  // Configurações visuais
  textColor: string;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  
  // Eventos
  onClick?: () => void;
  
  // Classes adicionais (para drag-and-drop, etc.)
  className?: string;
}

export const TextBlock = ({
  text,
  textColor,
  fontSize,
  textAlign,
  backgroundColor,
  borderColor,
  borderWidth,
  borderRadius,
  onClick,
  className = '',
}: TextBlockProps) => {
  return (
    <div
      className={`p-4 transition-all ${className}`}
      onClick={onClick}
      style={{
        backgroundColor,
        borderColor,
        borderWidth: `${borderWidth}px`,
        borderStyle: "solid",
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        maxWidth: '100%',
      }}
    >
      <p
        style={{
          color: textColor,
          fontSize: `${fontSize}px`,
          textAlign,
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          maxWidth: '100%',
        }}
      >
        {text}
      </p>
    </div>
  );
};
