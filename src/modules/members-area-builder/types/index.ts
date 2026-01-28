/**
 * Members Area Builder - Types Barrel Export
 * Re-exports públicos mantendo API compatível
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * @module members-area-builder/types
 */

// Viewport Types
export type { Viewport, ViewMode } from './viewport.types';

// Section Types
export type { SectionType, Section } from './section.types';

// Settings Types
export type {
  GradientDirection,
  GradientOverlayConfig,
  FixedHeaderSettings,
  BannerSlide,
  BannerSettings,
  ModulesSettings,
  CoursesSettings,
  ContinueWatchingSettings,
  TextSettings,
  SpacerSettings,
  SectionSettings,
  MenuItemConfig,
  MembersAreaBuilderSettings,
} from './settings.types';

// Builder State Types
export type { BuilderState, BuilderActions } from './builder-state.types';

// Registry Types
export type { SectionConfig } from './registry.types';

// Defaults
export {
  DEFAULT_GRADIENT_OVERLAY,
  DEFAULT_FIXED_HEADER_SETTINGS,
  DEFAULT_BANNER_SETTINGS,
  DEFAULT_MODULES_SETTINGS,
  DEFAULT_COURSES_SETTINGS,
  DEFAULT_CONTINUE_WATCHING_SETTINGS,
  DEFAULT_TEXT_SETTINGS,
  DEFAULT_SPACER_SETTINGS,
  DEFAULT_MENU_ITEMS,
  DEFAULT_BUILDER_SETTINGS,
} from './defaults';

// Re-export from members-area module for convenience
export type { MemberModule } from '@/modules/members-area/types/module.types';
