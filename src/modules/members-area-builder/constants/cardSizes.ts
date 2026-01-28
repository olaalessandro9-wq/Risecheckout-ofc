/**
 * Card Size Constants - SSOT for card sizes
 * Used by both Builder preview and Live Members Area
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

export type CardSize = 'small' | 'medium' | 'large';

/**
 * Card size mapping for Tailwind classes
 * Same values used in Builder (ModulesView) and Live Area (NetflixModuleCard)
 */
export const CARD_SIZE_MAP = {
  small: {
    desktop: 'w-[200px]',
    mobile: 'w-[160px]',
  },
  medium: {
    desktop: 'w-[260px]',
    mobile: 'w-[200px]',
  },
  large: {
    desktop: 'w-[320px]',
    mobile: 'w-[240px]',
  },
} as const;

/**
 * Get card width class based on size and viewport
 */
export function getCardWidthClass(size: CardSize | undefined, isMobile: boolean): string {
  const cardSize = size || 'medium';
  return CARD_SIZE_MAP[cardSize][isMobile ? 'mobile' : 'desktop'];
}
