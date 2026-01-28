/**
 * FixedHeader View - Renders fixed header section in builder canvas
 * Combines background image, title, stats, description and CTA button
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon, Play, BookOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FIXED_HEADER_LIMITS } from '@/lib/constants/field-limits';
import type { Section, FixedHeaderSettings, ViewMode } from '../../../types';
import type { MemberModule, ModuleWithContents } from '@/modules/members-area/types/module.types';
import { 
  generateCombinedOverlayStyle,
  resolveGradientConfig 
} from '../../../utils/gradientUtils';

interface FixedHeaderViewProps {
  section: Section;
  viewMode: ViewMode;
  theme: 'light' | 'dark';
  modules?: (MemberModule | ModuleWithContents)[];
  productName?: string;
  productDescription?: string;
  isPreviewMode?: boolean;
}

/**
 * Truncates title with ellipsis if it exceeds maxLength
 * RISE V3: Prevents layout overflow while maintaining readability
 */
function truncateTitle(title: string, maxLength: number): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
}

/**
 * Count total lessons from modules
 * Safely checks if module has contents array (ModuleWithContents)
 */
function countLessons(modules: (MemberModule | ModuleWithContents)[]): number {
  return modules.reduce((total, mod) => {
    const contents = 'contents' in mod ? mod.contents : [];
    return total + (contents?.length || 0);
  }, 0);
}

export function FixedHeaderView({ 
  section, 
  viewMode, 
  theme,
  modules = [],
  productName,
  productDescription,
  isPreviewMode = false 
}: FixedHeaderViewProps) {
  const settings = section.settings as FixedHeaderSettings;
  const hasImage = !!settings.bg_image_url;
  
  // Backwards compatibility + defaults
  const showTitle = settings.show_title ?? true;
  const showStats = settings.show_stats ?? settings.show_module_count ?? true;
  const showLessonCount = settings.show_lesson_count ?? true;
  const showDescription = settings.show_description ?? false;
  const showCtaButton = settings.show_cta_button ?? false;
  
  // Resolve gradient config
  const gradientConfig = resolveGradientConfig(settings.gradient_overlay);

  // RISE V3: Hero header sizes with viewport units + safety limits
  const heightClass = {
    small: 'h-96',                                    // 384px
    medium: 'h-[50vh] min-h-80 max-h-[500px]',       // 50% viewport
    large: 'h-[70vh] min-h-96 max-h-[800px]',        // 70% viewport (Hero)
  }[settings.size || 'large'];

  // Module and lesson counts
  const moduleCount = modules.length;
  const lessonCount = countLessons(modules);
  
  // Display title with truncation (fallback to product name)
  const rawTitle = settings.title || productName || 'Título do Curso';
  const displayTitle = truncateTitle(rawTitle, FIXED_HEADER_LIMITS.TITLE_TRUNCATE_DISPLAY);

  // Description (fallback to product description)
  const displayDescription = settings.description || productDescription || '';

  // Stats text
  const statsText = showLessonCount 
    ? `${moduleCount} ${moduleCount === 1 ? 'módulo' : 'módulos'} · ${lessonCount} ${lessonCount === 1 ? 'aula' : 'aulas'}`
    : `${moduleCount} ${moduleCount === 1 ? 'módulo' : 'módulos'}`;

  // Overlay style for gradient
  const overlayStyle = gradientConfig.enabled ? generateCombinedOverlayStyle(gradientConfig) : {};

  // Empty state for builder
  if (!hasImage && !isPreviewMode) {
    return (
      <div 
        className={cn(
          'flex flex-col items-center justify-center gap-4',
          heightClass,
          theme === 'dark' ? 'bg-zinc-800/50' : 'bg-gray-200'
        )}
      >
        <ImageIcon className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Adicione uma imagem de fundo
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Clique para editar a header
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className={cn('relative overflow-hidden bg-background', heightClass)}>
        {/* Background Image */}
        {hasImage && (
          <img
            src={settings.bg_image_url}
            alt="Header background"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        )}
        
        {/* Gradient Overlay */}
        {gradientConfig.enabled && (
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={overlayStyle}
          />
        )}

        {/* Content Overlay */}
        <div 
          className={cn(
            'absolute inset-0 z-20 flex flex-col justify-end',
            'px-6 md:px-8 lg:px-12',
            'pb-8 md:pb-12 lg:pb-16 xl:pb-20',
            'pt-6 md:pt-8',
            settings.alignment === 'center' && 'items-center text-center'
          )}
        >
          {/* Title */}
          {showTitle && (
            <h1 
              className={cn(
                'font-bold text-white drop-shadow-lg',
                'leading-tight max-w-3xl',
                settings.size === 'small' && 'text-2xl md:text-3xl',
                settings.size === 'medium' && 'text-3xl md:text-4xl',
                settings.size === 'large' && 'text-4xl md:text-5xl lg:text-6xl'
              )}
            >
              {displayTitle}
            </h1>
          )}
          
          {/* Stats Badge */}
          {showStats && (
            <div 
              className={cn(
                'mt-3 md:mt-4',
                settings.alignment === 'center' && 'flex justify-center'
              )}
            >
              <span 
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
                  'text-sm font-medium',
                  'bg-white/20 text-white backdrop-blur-sm',
                  'border border-white/30'
                )}
              >
                <BookOpen className="h-4 w-4" />
                {statsText}
              </span>
            </div>
          )}

          {/* Description */}
          {showDescription && displayDescription && (
            <p 
              className={cn(
                'mt-4 text-white/90 drop-shadow max-w-2xl',
                'text-sm md:text-base leading-relaxed',
                'line-clamp-3'
              )}
            >
              {displayDescription}
            </p>
          )}

          {/* CTA Button */}
          {showCtaButton && (
            <div className={cn('mt-6', settings.alignment === 'center' && 'flex justify-center')}>
              <Button 
                size="lg" 
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              >
                <Play className="h-5 w-5 fill-current" />
                {settings.cta_button_text || 'Começar a Assistir'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
