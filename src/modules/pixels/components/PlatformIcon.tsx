/**
 * PlatformIcon Component
 * 
 * @module modules/pixels/components
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Renderiza ícone com cor específica para cada plataforma de pixel.
 */

import { Facebook, Music, Target, Video } from "lucide-react";
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
// COMPONENT
// ============================================================================

export function PlatformIcon({ platform, size = 20, className = "" }: PlatformIconProps) {
  const { color } = PLATFORM_INFO[platform];
  
  const iconProps = {
    size,
    className,
    style: { color },
  };

  switch (platform) {
    case 'facebook':
      return <Facebook {...iconProps} />;
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
