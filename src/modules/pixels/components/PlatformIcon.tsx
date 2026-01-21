/**
 * PlatformIcon Component
 * 
 * @module modules/pixels/components
 * @version 1.1.0 - RISE Protocol V3 Compliant
 * 
 * Renderiza ícone com cor específica para cada plataforma de pixel.
 * 
 * NOTA: Usa SVG customizado para Facebook pois lucide-react não possui
 * ícone oficial da marca. TikTok usa Music como proxy visual.
 */

import { Music, Target, Video, type LucideProps } from "lucide-react";
import { PLATFORM_INFO } from "../types";
import type { PixelPlatform } from "../types";

// ============================================================================
// TYPES
// ============================================================================

interface PlatformIconProps {
  readonly platform: PixelPlatform;
  readonly size?: number;
  readonly className?: string;
}

// ============================================================================
// CUSTOM ICONS (Brand-specific SVGs)
// ============================================================================

/**
 * Facebook brand icon (official shape)
 * Lucide não inclui ícones de marca por política de licenciamento
 */
function FacebookIcon({ size = 20, color, className }: Omit<LucideProps, 'ref'>) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={color}
      className={className}
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PlatformIcon({ platform, size = 20, className = "" }: PlatformIconProps) {
  const { color } = PLATFORM_INFO[platform];
  
  const iconProps = {
    size,
    className,
    color,
  };

  switch (platform) {
    case 'facebook':
      return <FacebookIcon {...iconProps} />;
    case 'tiktok':
      return <Music {...iconProps} />;
    case 'google_ads':
      return <Target {...iconProps} />;
    case 'kwai':
      return <Video {...iconProps} />;
    default:
      return null;
  }
}
