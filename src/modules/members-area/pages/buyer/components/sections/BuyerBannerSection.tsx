/**
 * Buyer Banner Section - Renderiza banner do Builder na área do aluno
 * Com suporte a swipe/drag via Embla Carousel e Gradient Overlay
 * 
 * RISE V3 10.0/10 - Arquitetura Netflix Real:
 * - Gradiente INTERNO que termina em cor sólida
 * - Não precisa de "extension" externa
 * - Transição imperceptível para o conteúdo abaixo
 */

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { 
  generateBottomFadeCSS,
  generateSideGradientCSS, 
  resolveGradientConfig 
} from '@/modules/members-area-builder/utils/gradientUtils';
import type { GradientOverlayConfig } from '@/modules/members-area-builder/types/builder.types';

interface BannerSlide {
  id: string;
  image_url: string;
  link?: string;
  alt?: string;
}

interface BannerSettings {
  type: 'banner';
  slides: BannerSlide[];
  transition_seconds: number;
  height: 'small' | 'medium' | 'large';
  gradient_overlay?: GradientOverlayConfig;
}

interface BuyerBannerSectionProps {
  settings: BannerSettings;
  title?: string | null;
}

export function BuyerBannerSection({ settings, title }: BuyerBannerSectionProps) {
  const slides = settings.slides || [];
  const hasSlides = slides.length > 0;
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Resolve gradient config with backwards compatibility
  const gradientConfig = resolveGradientConfig(settings.gradient_overlay);

  const autoplayPlugin = Autoplay({
    delay: (settings.transition_seconds || 5) * 1000,
    stopOnInteraction: false,
    stopOnMouseEnter: true,
  });

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, dragFree: false },
    slides.length > 1 ? [autoplayPlugin] : []
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => {
    if (!emblaApi) return;
    emblaApi.scrollTo(index);
  }, [emblaApi]);

  // Height classes matching Builder exactly
  const heightClass = {
    small: 'h-40',    // 160px
    medium: 'h-64',   // 256px
    large: 'h-96',    // 384px
  }[settings.height || 'medium'];

  if (!hasSlides) {
    return null; // Don't show empty banners in buyer area
  }

  return (
    <div className="w-full">
      {title && (
        <h2 className="text-lg font-semibold text-foreground mb-3 px-4 md:px-8">
          {title}
        </h2>
      )}
      
      {/* Container único com overflow-hidden */}
      <div className={cn('relative overflow-hidden', heightClass)}>
        {/* Carousel */}
        <div ref={emblaRef} className="overflow-hidden h-full cursor-grab active:cursor-grabbing">
          <div className="flex h-full">
            {slides.map((slide, index) => (
              <div 
                key={slide.id} 
                className="relative w-full h-full flex-shrink-0 flex-grow-0 basis-full"
              >
                <img
                  src={slide.image_url}
                  alt={slide.alt || `Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {slide.link && (
                  <a 
                    href={slide.link} 
                    className="absolute inset-0"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Gradientes Netflix: INTERNOS, fazem a imagem terminar em cor sólida */}
        {gradientConfig.enabled && (
          <>
            {/* Bottom fade - principal (Netflix-style) */}
            <div 
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: generateBottomFadeCSS(gradientConfig)
              }}
            />
            
            {/* Side gradient para profundidade (vinheta lateral) */}
            <div 
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: generateSideGradientCSS(gradientConfig)
              }}
            />
          </>
        )}

        {/* Indicators - z-20 to stay above gradient */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, index) => (
              <button
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === selectedIndex 
                    ? 'bg-white w-4' 
                    : 'bg-white/50 hover:bg-white/75'
                )}
                onClick={() => scrollTo(index)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* NÃO TEM MAIS GRADIENT EXTENSION - arquitetura Netflix não precisa */}
    </div>
  );
}
