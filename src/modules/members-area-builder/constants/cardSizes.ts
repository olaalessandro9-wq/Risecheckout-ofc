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
    desktop: 'w-[180px]',
    mobile: 'w-[130px]',
  },
  medium: {
    desktop: 'w-[220px]',
    mobile: 'w-[160px]',
  },
  large: {
    desktop: 'w-[280px]',
    mobile: 'w-[200px]',
  },
} as const;

/**
 * Get card width class based on size and viewport
 */
export function getCardWidthClass(size: CardSize | undefined, isMobile: boolean): string {
  const cardSize = size || 'medium';
  return CARD_SIZE_MAP[cardSize][isMobile ? 'mobile' : 'desktop'];
}
