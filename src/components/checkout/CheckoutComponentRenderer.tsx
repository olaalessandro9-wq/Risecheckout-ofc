/**
 * CheckoutComponentRenderer - Renderizador de componentes para o checkout público
 * 
 * Usa os componentes refatorados de @/features/checkout-builder/components
 * Mantém compatibilidade com o design system e props legadas
 * 
 * SEGURANÇA: Usa configuração centralizada de sanitização XSS de @/lib/security
 */

import { 
  CountdownTimer, 
  Testimonial, 
  VideoEmbed, 
  TextBlock, 
  ImageBlock, 
  BenefitBlock, 
  BadgeBlock 
} from "@/features/checkout-builder/components";
import { sanitize, sanitizeText, sanitizeUrl, SAFE_HTML_CONFIG } from "@/lib/security";
import DOMPurify from 'dompurify';
import type { ThemePreset } from "@/lib/checkout/themePresets";

/**
 * Conteúdo dinâmico do componente de checkout
 * 
 * NOTA ARQUITETURAL: Este tipo usa Record<string, unknown> com casting
 * porque os componentes têm estruturas muito variadas e dinâmicas.
 * Uma tipagem estrita aqui causaria mais complexidade do que benefício.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynamicContent = Record<string, any>;

interface CheckoutComponentRendererProps {
  component: {
    id?: string;
    type: string;
    content?: DynamicContent;
  };
  design?: ThemePreset;
  isPreviewMode?: boolean;
}

const CheckoutComponentRenderer = ({ 
  component, 
  design, 
  isPreviewMode = false 
}: CheckoutComponentRendererProps) => {
  if (!component || !component.type) return null;

  switch (component.type) {
    case 'timer':
      return (
        <div style={{ backgroundColor: design?.colors.background || 'transparent' }} className="w-full">
          <CountdownTimer
            initialMinutes={component.content?.minutes || 15}
            initialSeconds={component.content?.seconds || 0}
            backgroundColor={component.content?.timerColor || design?.colors.active || '#10B981'}
            textColor={component.content?.textColor || '#FFFFFF'}
            activeText={component.content?.activeText || "Oferta por tempo limitado"}
            finishedText={component.content?.finishedText || "Oferta finalizada"}
            className="w-full"
          />
        </div>
      );

    case 'testimonial':
      return (
        <div className="w-full mb-6">
          <Testimonial
            testimonialText={sanitizeText(component.content?.text || component.content?.testimonialText || "Depoimento do cliente")}
            authorName={sanitizeText(component.content?.name || component.content?.authorName || "Nome do Cliente")}
            authorImage={sanitizeUrl(component.content?.avatar || component.content?.authorImage || "")}
            backgroundColor={design?.colors.formBackground || "#F9FAFB"}
            textColor={design?.colors.primaryText || "#000000"}
            authorColor={design?.colors.secondaryText || "#6B7280"}
          />
        </div>
      );

    case 'video':
      return (
        <div className="w-full mb-6">
          <VideoEmbed
            videoUrl={sanitizeUrl(component.content?.url || component.content?.videoUrl || "")}
            videoType={component.content?.videoType || "youtube"}
            backgroundColor={design?.colors.formBackground || "#F9FAFB"}
            placeholderColor={design?.colors.secondaryText || "#9CA3AF"}
          />
        </div>
      );

    case 'text':
      // Suporte para texto HTML (legado) e texto simples (novo)
      // Usa configuração centralizada de sanitização XSS
      if (component.content?.text && component.content.text.includes('<')) {
        return (
          <div className="w-full mb-6">
            <div
              className="prose prose-sm max-w-none"
              style={{
                textAlign: component.content.alignment || 'left',
                fontSize: component.content.size || '16px',
                color: component.content.color || 'inherit',
              }}
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(component.content.text, SAFE_HTML_CONFIG)
              }}
            />
          </div>
        );
      }
      
      return (
        <div className="w-full mb-6">
          <TextBlock
            text={component.content?.text || "Texto editável"}
            textColor={component.content?.color || design?.colors.primaryText || "#000000"}
            fontSize={component.content?.fontSize || parseInt(component.content?.size) || 16}
            textAlign={component.content?.alignment || "center"}
            backgroundColor={component.content?.backgroundColor || "#FFFFFF"}
            borderColor={component.content?.borderColor || "#E5E7EB"}
            borderWidth={component.content?.borderWidth || 1}
            borderRadius={component.content?.borderRadius || 8}
          />
        </div>
      );

    case 'image': {
      const src = typeof component.content?.imageUrl === 'string'
        ? component.content.imageUrl
        : (typeof component.content?.url === 'string' ? component.content.url : '');

      if (!src) {
        return (
          <div className="w-full border border-dashed rounded-lg p-6 text-center text-sm opacity-70 mb-6">
            Imagem – clique para adicionar
          </div>
        );
      }

      return (
        // AJUSTE DE ESPAÇAMENTO:
        // - mt-4: Adiciona margem superior para separar do cronômetro
        // - mb-4: Mantém margem inferior para separar do checkout
        // - Resultado: Espaçamento simétrico em cima e embaixo
        <div className="w-full flex justify-center mt-4 mb-4">
          <ImageBlock
            imageUrl={src}
            alt={component.content?.alt || 'Imagem'}
            alignment={component.content?.alignment || "center"}
            maxWidth={component.content?.maxWidth || 1200}
            roundedImage={component.content?.roundedImage !== false}
          />
        </div>
      );
    }

    case 'advantage':
      return (
        <div className="w-full mb-6">
          <BenefitBlock
            title={sanitizeText(component.content?.title || "Vantagem")}
            description={sanitizeText(component.content?.description || "Descrição da vantagem")}
            icon={component.content?.icon || "check"}
            primaryColor={component.content?.primaryColor || "#1DB88E"}
            titleColor={component.content?.titleColor || "#000000"}
            descriptionColor={design?.colors.secondaryText || "#6B7280"}
            backgroundColor={"#FFFFFF"}
            darkMode={component.content?.darkMode || false}
            verticalMode={component.content?.verticalMode || false}
            size={component.content?.size || "original"}
          />
        </div>
      );

    case 'seal':
      return (
        <div className="w-full mb-6">
          <BadgeBlock
            topText={sanitizeText(component.content?.topText || "7")}
            title={sanitizeText(component.content?.title || "Privacidade")}
            subtitle={sanitizeText(component.content?.subtitle || "Garantida")}
            primaryColor={component.content?.primaryColor || "#4F9EF8"}
            titleColor={component.content?.titleColor || "#FFFFFF"}
            alignment={component.content?.alignment || "center"}
            darkMode={component.content?.darkMode || false}
          />
        </div>
      );

    case 'guarantee':
      return (
        <div className="w-full mb-6 p-6 rounded-lg border" 
          style={{
            backgroundColor: design?.colors.infoBox?.background || 'transparent',
            borderColor: design?.colors.infoBox?.border || 'transparent'
          }}
        >
          <div className="flex items-start gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: design?.colors.active || '#10B981' }}
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold mb-2" style={{ color: design?.colors.infoBox?.text || design?.colors.primaryText }}>
                {sanitizeText(component.content?.title || 'Garantia de Satisfação')}
              </h3>
              <p className="text-sm" style={{ color: design?.colors.infoBox?.text || design?.colors.primaryText }}>
                {sanitizeText(component.content?.text || 'Garantia de 7 dias. Se não gostar, devolvemos seu dinheiro.')}
              </p>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default CheckoutComponentRenderer;
