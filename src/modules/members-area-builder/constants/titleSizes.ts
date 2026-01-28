/**
 * Title Size Constants - SSOT for section title sizes
 * Used by both Builder preview and Live Members Area
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

export type TitleSize = 'small' | 'medium' | 'large';

/**
 * Title size mapping for Tailwind classes
 * Based on streaming platforms analysis (Paramount+, Netflix, Disney+)
 * 
 * Small:  16px desktop / 14px mobile
 * Medium: 20px desktop / 18px mobile (default)
 * Large:  28px desktop / 22px mobile (Paramount+ style)
 */
export const TITLE_SIZE_MAP = {
  small: {
    desktop: 'text-base font-semibold',
    mobile: 'text-sm font-semibold',
  },
  medium: {
    desktop: 'text-xl font-semibold',
    mobile: 'text-lg font-semibold',
  },
  large: {
    desktop: 'text-2xl font-bold',
    mobile: 'text-xl font-bold',
  },
} as const;

/**
 * Get title size class based on size and viewport
 */
export function getTitleSizeClass(size: TitleSize | undefined, isMobile: boolean): string {
  const titleSize = size || 'medium';
  return TITLE_SIZE_MAP[titleSize][isMobile ? 'mobile' : 'desktop'];
}
