/**
 * BenefitBlock - Componente "Burro" de UI
 * 
 * Responsabilidade: Apenas renderizar um bloco de vantagem/benefício com ícone.
 * NÃO conhece sobre: layout global, posicionamento, design system, etc.
 * 
 * Princípio aplicado: Separação de Responsabilidades (Vibe Coding)
 * 
 * Nota: Este componente era chamado de "advantage" no código antigo.
 */

import { CheckIconCakto } from "@/components/icons/CheckIconCakto";

export interface BenefitBlockProps {
  // Conteúdo
  title: string;
  description: string;
  icon: string; // Tipo do ícone (atualmente só "check" é usado)
  
  // Configurações visuais
  primaryColor: string;
  titleColor: string;
  descriptionColor: string;
  backgroundColor: string;
  darkMode: boolean;
  verticalMode: boolean;
  size: 'small' | 'original' | 'large';
  
  // Eventos
  onClick?: () => void;
  
  // Classes adicionais (para drag-and-drop, etc.)
  className?: string;
}

const getSizeClass = (size: 'small' | 'original' | 'large'): string => {
  if (size === "small") return "text-xs";
  if (size === "large") return "text-lg";
  return "text-sm";
};

const getIconSize = (size: 'small' | 'original' | 'large'): number => {
  if (size === "small") return 32;
  if (size === "large") return 56;
  return 40;
};

export const BenefitBlock = ({
  title,
  description,
  icon,
  primaryColor,
  titleColor,
  descriptionColor,
  backgroundColor,
  darkMode,
  verticalMode,
  size,
  onClick,
  className = '',
}: BenefitBlockProps) => {
  const sizeClass = getSizeClass(size);
  const iconSize = getIconSize(size);

  return (
    <div 
      className={`p-4 rounded-lg flex ${verticalMode ? 'flex-col items-center text-center' : 'items-center'} gap-4 ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: darkMode ? "#1F2937" : backgroundColor,
        border: "1px solid #E5E7EB",
      }}
    >
      <div className="flex-shrink-0">
        <CheckIconCakto 
          size={iconSize}
          color={primaryColor}
        />
      </div>
      <div className="flex-1">
        <p 
          className={`font-semibold mb-1 ${sizeClass}`}
          style={{ color: darkMode ? "#FFFFFF" : titleColor }}
        >
          {title}
        </p>
        <p 
          className={sizeClass}
          style={{ color: darkMode ? "#D1D5DB" : descriptionColor }}
        >
          {description}
        </p>
      </div>
    </div>
  );
};
