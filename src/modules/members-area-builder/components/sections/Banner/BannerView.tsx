/**
 * Banner View - Renderiza seção de banner/slideshow
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Section, BannerSettings, ViewMode } from '../../../types/builder.types';

interface BannerViewProps {
  section: Section;
  viewMode: ViewMode;
  theme: 'light' | 'dark';
}

export function BannerView({ section, viewMode, theme }: BannerViewProps) {
  const settings = section.settings as BannerSettings;
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = settings.slides || [];
  const hasSlides = slides.length > 0;
  
  // Auto-advance slides
  useEffect(() => {
    if (slides.length <= 1 || !settings.transition_seconds) return;
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, settings.transition_seconds * 1000);
    
    return () => clearInterval(interval);
  }, [slides.length, settings.transition_seconds]);

  const heightClass = {
    small: 'h-40',
    medium: 'h-64',
    large: 'h-96',
  }[settings.height || 'medium'];

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrev = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };

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
      {/* Slides */}
      <div 
        className="absolute inset-0 flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div 
            key={slide.id} 
            className="relative w-full h-full flex-shrink-0"
          >
            <img
              src={slide.image_url}
              alt={slide.alt || `Slide ${index + 1}`}
              className="w-full h-full object-cover"
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

      {/* Navigation Arrows */}
      {settings.show_navigation && slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white"
            onClick={goToPrev}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white"
            onClick={goToNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Indicators */}
      {settings.show_indicators && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentSlide 
                  ? 'bg-white w-4' 
                  : 'bg-white/50 hover:bg-white/75'
              )}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
