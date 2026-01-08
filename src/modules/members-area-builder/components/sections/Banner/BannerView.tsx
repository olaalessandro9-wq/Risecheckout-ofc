/**
 * Banner View - Renderiza seção de banner/slideshow com swipe/drag
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React, { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import type { Section, BannerSettings, ViewMode } from '../../../types/builder.types';

interface BannerViewProps {
  section: Section;
  viewMode: ViewMode;
  theme: 'light' | 'dark';
}

export function BannerView({ section, viewMode, theme }: BannerViewProps) {
  const settings = section.settings as BannerSettings;
  const slides = settings.slides || [];
  const hasSlides = slides.length > 0;
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  const heightClass = {
    small: 'h-40',
    medium: 'h-64',
    large: 'h-96',
  }[settings.height || 'medium'];

  if (!hasSlides) {
    return (
      <div 
        className={cn(
          'flex flex-col items-center justify-center gap-2',
          heightClass,
          theme === 'dark' ? 'bg-zinc-800/50' : 'bg-gray-200'
        )}
      >
        <ImageIcon className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Adicione imagens ao banner
        </p>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', heightClass)}>
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

      {/* Indicators - Always visible when multiple slides */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
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
  );
}
