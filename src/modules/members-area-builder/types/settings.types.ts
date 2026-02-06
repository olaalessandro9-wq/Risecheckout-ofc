/**
 * Members Area Builder - Settings Types
 * Interfaces de configurações de seções e configurações globais
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * @module members-area-builder/types
 */

// =====================================================
// GRADIENT OVERLAY CONFIG (Netflix-style transitions)
// =====================================================

export type GradientDirection = 'bottom' | 'top' | 'left' | 'right';

export interface GradientOverlayConfig {
  enabled: boolean;
  direction: GradientDirection;
  strength: number; // 0-100 (controla ponto médio do gradiente)
  use_theme_color: boolean; // Se true, usa hsl(var(--background))
  custom_color?: string; // Hex color quando use_theme_color = false
}

// =====================================================
// FIXED HEADER SETTINGS (Always at top, non-movable)
// =====================================================

export interface FixedHeaderSettings {
  type: 'fixed_header';
  bg_image_url: string;
  /** URL da imagem original (sem crop) para re-crop sem perda de qualidade */
  bg_image_original_url?: string;
  
  // Title
  title: string;
  show_title: boolean;
  
  // Stats (módulos + aulas)
  show_stats: boolean;
  show_lesson_count: boolean;
  
  // Description
  show_description: boolean;
  description: string;
  
  // CTA Button
  show_cta_button: boolean;
  cta_button_text: string;
  
  // Visual settings
  alignment: 'left' | 'center';
  size: 'small' | 'medium' | 'large';
  /** @deprecated Use MembersAreaBuilderSettings.gradient_overlay (global SSOT) */
  gradient_overlay?: GradientOverlayConfig;
  
  /** @deprecated Use show_stats instead - kept for backwards compatibility */
  show_module_count?: boolean;
}

// =====================================================
// BANNER SETTINGS
// =====================================================

export interface BannerSlide {
  id: string;
  image_url: string;
  /** URL da imagem original (sem crop) para re-crop sem perda de qualidade */
  original_image_url?: string;
  link?: string;
  alt?: string;
}

export interface BannerSettings {
  type: 'banner';
  slides: BannerSlide[];
  transition_seconds: number;
  height: 'small' | 'medium' | 'large';
  /** @deprecated Use MembersAreaBuilderSettings.gradient_overlay (global SSOT) */
  gradient_overlay?: GradientOverlayConfig;
}

// =====================================================
// MODULES SETTINGS
// =====================================================

export interface ModulesSettings {
  type: 'modules';
  course_id: string | null;
  show_title: 'always' | 'hover' | 'never';
  show_progress: boolean;
  module_order?: string[]; // Custom order of module IDs
  hidden_module_ids?: string[]; // Module IDs hidden from this section
  card_size: 'small' | 'medium' | 'large';
  title_size: 'small' | 'medium' | 'large';
}

// =====================================================
// OTHER SECTION SETTINGS
// =====================================================

export interface CoursesSettings {
  type: 'courses';
  course_ids: string[];
  layout: 'grid' | 'carousel';
  cards_per_row: 3 | 4;
}

export interface ContinueWatchingSettings {
  type: 'continue_watching';
  max_items: number;
}

export interface TextSettings {
  type: 'text';
  content: string;
  alignment: 'left' | 'center' | 'right';
}

export interface SpacerSettings {
  type: 'spacer';
  height: number; // px
}

// =====================================================
// DISCRIMINATED UNION
// =====================================================

export type SectionSettings = 
  | FixedHeaderSettings
  | BannerSettings
  | ModulesSettings
  | CoursesSettings
  | ContinueWatchingSettings
  | TextSettings
  | SpacerSettings;

// =====================================================
// GLOBAL SETTINGS
// =====================================================

export interface MenuItemConfig {
  id: string;
  label: string;
  icon: string;
  link?: string;
  is_default: boolean;
  is_visible: boolean;
}

export interface MembersAreaBuilderSettings {
  // Theme
  theme: 'light' | 'dark';
  primary_color: string;
  
  // Branding
  logo_url?: string;
  favicon_url?: string;
  share_image_url?: string;
  
  // Menu Visibility
  show_menu_desktop: boolean;
  show_menu_mobile: boolean;
  
  // Menu Items
  menu_items: MenuItemConfig[];
  
  // Sidebar Animation (Desktop only - mobile always uses bottom nav)
  sidebar_animation: 'click' | 'hover';
  
  // Global Gradient Overlay (Netflix-style, applies to entire members area)
  // SSOT: All sections read from here instead of per-section config
  gradient_overlay: GradientOverlayConfig;
  
  // Login Page
  login_layout: 'centered' | 'sidebar';
  login_background_url?: string;
  login_logo_url?: string;
}
