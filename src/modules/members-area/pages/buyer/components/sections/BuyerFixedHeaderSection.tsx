/**
 * Buyer Fixed Header Section - RISE V3 10.0/10
 * Renders fixed header from Builder in student area
 * Combines background image, title and module counter (Cakto-style)
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { cn } from '@/lib/utils';
import { 
  generateCombinedOverlayStyle,
  resolveGradientConfig 
} from '@/modules/members-area-builder/utils/gradientUtils';
import type { GradientOverlayConfig } from '@/modules/members-area-builder/types/builder.types';

interface FixedHeaderSettings {
  type: 'fixed_header';
  bg_image_url: string;
  title: string;
  show_module_count: boolean;
  alignment: 'left' | 'center';
  size: 'small' | 'medium' | 'large';
  gradient_overlay?: GradientOverlayConfig;
}

interface BuyerFixedHeaderSectionProps {
  settings: FixedHeaderSettings;
  moduleCount: number;
  productName?: string;
}

export function BuyerFixedHeaderSection({ 
  settings, 
  moduleCount, 
  productName 
}: BuyerFixedHeaderSectionProps) {
  const hasImage = !!settings.bg_image_url;
  
  // Resolve gradient config
  const gradientConfig = resolveGradientConfig(settings.gradient_overlay);

  // RISE V3: Hero header sizes with viewport units + safety limits
  const heightClass = {
    small: 'h-96',                                    // 384px
    medium: 'h-[50vh] min-h-80 max-h-[500px]',       // 50% viewport
    large: 'h-[70vh] min-h-96 max-h-[800px]',        // 70% viewport (Hero)
  }[settings.size || 'large'];

  // Module count text
  const moduleText = moduleCount === 1 ? '1 módulo' : `${moduleCount} módulos`;
  
  // Display title (fallback to product name)
  const displayTitle = settings.title || productName || '';

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
            'absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-8 lg:p-12',
            settings.alignment === 'center' && 'items-center text-center'
          )}
        >
          {/* Title */}
          {displayTitle && (
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
          
          {/* Module Counter Badge */}
          {settings.show_module_count && moduleCount > 0 && (
            <div 
              className={cn(
                'mt-3 md:mt-4',
                settings.alignment === 'center' && 'flex justify-center'
              )}
            >
              <span 
                className={cn(
                  'inline-flex items-center px-3 py-1.5 rounded-full',
                  'text-sm font-medium',
                  'bg-white/20 text-white backdrop-blur-sm',
                  'border border-white/30'
                )}
              >
                {moduleText}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
