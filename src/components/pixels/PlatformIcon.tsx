/**
 * Componente: PlatformIcon
 * Renderiza ícone com cor específica para cada plataforma de pixel
 */

import { Facebook, Music, Target, Video } from "lucide-react";
import type { PixelPlatform } from "./types";
import { PLATFORM_INFO } from "./types";

interface PlatformIconProps {
  platform: PixelPlatform;
  size?: number;
  className?: string;
}

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
