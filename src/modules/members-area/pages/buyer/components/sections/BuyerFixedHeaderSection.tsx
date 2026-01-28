/**
 * Buyer Fixed Header Section - RISE V3 10.0/10
 * Renders fixed header from Builder in student area
 * Combines background image, title, stats, description and CTA button
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Play, BookOpen } from 'lucide-react';
import { FIXED_HEADER_LIMITS } from '@/lib/constants/field-limits';
import { 
  generateCombinedOverlayStyle,
  resolveGradientConfig 
} from '@/modules/members-area-builder/utils/gradientUtils';
import type { FixedHeaderSettings } from '@/modules/members-area-builder/types';

interface BuyerFixedHeaderSectionProps {
  settings: FixedHeaderSettings;
  moduleCount: number;
  lessonCount: number;
  productName?: string;
  productDescription?: string;
  onStartCourse?: () => void;
}

/**
 * Truncates title with ellipsis if it exceeds maxLength
 * RISE V3: Prevents layout overflow while maintaining readability
 */
function truncateTitle(title: string, maxLength: number): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
}

export function BuyerFixedHeaderSection({ 
  settings, 
  moduleCount,
  lessonCount,
  productName,
  productDescription,
  onStartCourse,
}: BuyerFixedHeaderSectionProps) {
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

  // Stats text
  const statsText = showLessonCount 
    ? `${moduleCount} ${moduleCount === 1 ? 'módulo' : 'módulos'} · ${lessonCount} ${lessonCount === 1 ? 'aula' : 'aulas'}`
    : `${moduleCount} ${moduleCount === 1 ? 'módulo' : 'módulos'}`;
  
  // Display title with truncation (fallback to product name)
  const rawTitle = settings.title || productName || '';
  const displayTitle = rawTitle ? truncateTitle(rawTitle, FIXED_HEADER_LIMITS.TITLE_TRUNCATE_DISPLAY) : '';

  // Description (fallback to product description)
  const displayDescription = settings.description || productDescription || '';

  // Overlay style for gradient
  const overlayStyle = gradientConfig.enabled ? generateCombinedOverlayStyle(gradientConfig) : {};

  // Don't render if no image
  if (!hasImage) {
    return null;
  }

  return (
    <div className="w-full">
      <div className={cn('relative overflow-hidden bg-background', heightClass)}>
        {/* Background Image */}
        <img
          src={settings.bg_image_url}
          alt="Header background"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        
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
          {showTitle && displayTitle && (
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
          {showStats && (moduleCount > 0 || lessonCount > 0) && (
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
          {showCtaButton && onStartCourse && (
            <div className={cn('mt-6', settings.alignment === 'center' && 'flex justify-center')}>
              <Button 
                size="lg" 
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                onClick={onStartCourse}
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
