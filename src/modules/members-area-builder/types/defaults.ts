/**
 * Members Area Builder - Defaults
 * Valores padrão para todas as configurações
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * @module members-area-builder/types
 */

import type { 
  GradientOverlayConfig,
  FixedHeaderSettings,
  BannerSettings,
  ModulesSettings,
  CoursesSettings,
  ContinueWatchingSettings,
  TextSettings,
  SpacerSettings,
  MenuItemConfig,
  MembersAreaBuilderSettings,
} from './settings.types';

// =====================================================
// GRADIENT OVERLAY DEFAULT
// =====================================================

export const DEFAULT_GRADIENT_OVERLAY: GradientOverlayConfig = {
  enabled: true, // Ativado por padrão para melhor UX out-of-the-box
  direction: 'bottom',
  strength: 60,
  use_theme_color: true,
  custom_color: undefined,
};

// =====================================================
// SECTION SETTINGS DEFAULTS
// =====================================================

export const DEFAULT_FIXED_HEADER_SETTINGS: Omit<FixedHeaderSettings, 'type'> = {
  bg_image_url: '',
  title: '',
  show_title: true,
  show_stats: true,
  show_lesson_count: true,
  show_description: true,
  description: '',
  show_cta_button: true,
  cta_button_text: 'Começar a Assistir',
  alignment: 'left',
  size: 'large',
  gradient_overlay: DEFAULT_GRADIENT_OVERLAY,
};

export const DEFAULT_BANNER_SETTINGS: Omit<BannerSettings, 'type'> = {
  slides: [
    {
      id: crypto.randomUUID(),
      image_url: '',
      link: '',
      alt: '',
    }
  ],
  transition_seconds: 5,
  height: 'medium',
  gradient_overlay: DEFAULT_GRADIENT_OVERLAY,
};

export const DEFAULT_MODULES_SETTINGS: Omit<ModulesSettings, 'type'> = {
  course_id: null,
  show_title: 'always',
  show_progress: true,
  module_order: [],
  hidden_module_ids: [],
  card_size: 'medium',
  title_size: 'medium',
};

export const DEFAULT_COURSES_SETTINGS: Omit<CoursesSettings, 'type'> = {
  course_ids: [],
  layout: 'carousel',
  cards_per_row: 4,
};

export const DEFAULT_CONTINUE_WATCHING_SETTINGS: Omit<ContinueWatchingSettings, 'type'> = {
  max_items: 10,
};

export const DEFAULT_TEXT_SETTINGS: Omit<TextSettings, 'type'> = {
  content: '',
  alignment: 'left',
};

export const DEFAULT_SPACER_SETTINGS: Omit<SpacerSettings, 'type'> = {
  height: 40,
};

// =====================================================
// GLOBAL SETTINGS DEFAULTS
// =====================================================

export const DEFAULT_MENU_ITEMS: MenuItemConfig[] = [
  { id: 'home', label: 'Início', icon: 'Home', is_default: true, is_visible: true },
  { id: 'continue', label: 'Continuar', icon: 'Play', is_default: true, is_visible: true },
  { id: 'courses', label: 'Meus Cursos', icon: 'BookOpen', is_default: false, is_visible: true },
];

export const DEFAULT_BUILDER_SETTINGS: MembersAreaBuilderSettings = {
  theme: 'dark',
  primary_color: '#6366f1',
  logo_url: undefined,
  favicon_url: undefined,
  share_image_url: undefined,
  show_menu_desktop: true,
  show_menu_mobile: true,
  menu_items: DEFAULT_MENU_ITEMS,
  sidebar_animation: 'click',
  login_layout: 'centered',
  login_background_url: undefined,
  login_logo_url: undefined,
};
