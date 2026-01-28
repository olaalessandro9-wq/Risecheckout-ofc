/**
 * Members Area Builder - Types
 * Tipos canônicos para o sistema de builder da área de membros
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import type { MemberModule } from '@/modules/members-area/types/module.types';

// Re-export for convenience
export type { MemberModule };

// =====================================================
// VIEWPORT TYPES (NEW - Dual Layout)
// =====================================================

export type Viewport = 'desktop' | 'mobile';

// =====================================================
// SECTION TYPES
// =====================================================

export type SectionType = 
  | 'banner' 
  | 'modules' 
  | 'courses' 
  | 'continue_watching' 
  | 'text' 
  | 'spacer';

export interface Section {
  id: string;
  product_id: string;
  type: SectionType;
  viewport: Viewport; // NEW: Identifies which layout this section belongs to
  title: string | null;
  position: number;
  settings: SectionSettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// SECTION SETTINGS (Discriminated Union)
// =====================================================

export type SectionSettings = 
  | BannerSettings 
  | ModulesSettings 
  | CoursesSettings 
  | ContinueWatchingSettings
  | TextSettings
  | SpacerSettings;

export interface BannerSlide {
  id: string;
  image_url: string;
  link?: string;
  alt?: string;
}

export interface BannerSettings {
  type: 'banner';
  slides: BannerSlide[];
  transition_seconds: number;
  height: 'small' | 'medium' | 'large';
}

export interface ModulesSettings {
  type: 'modules';
  course_id: string | null;
  show_title: 'always' | 'hover' | 'never';
  show_progress: boolean;
  module_order?: string[]; // Custom order of module IDs
  hidden_module_ids?: string[]; // Module IDs hidden from this section
  // Card size control - determines card width in carousel (Netflix-style)
  card_size: 'small' | 'medium' | 'large';
}

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
// MEMBERS AREA GLOBAL SETTINGS
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
  
  // Login Page
  login_layout: 'centered' | 'sidebar';
  login_background_url?: string;
  login_logo_url?: string;
}

// =====================================================
// BUILDER STATE
// =====================================================

export type ViewMode = 'desktop' | 'mobile';

export interface BuilderState {
  // Dual-Layout: Separate sections by viewport
  desktopSections: Section[];
  mobileSections: Section[];
  
  // Active editing viewport
  activeViewport: Viewport;
  
  // Mobile sync mode: when true, mobile mirrors desktop automatically
  isMobileSynced: boolean;
  
  // Computed: returns sections for active viewport
  sections: Section[];
  
  settings: MembersAreaBuilderSettings;
  selectedSectionId: string | null;
  selectedMenuItemId: string | null;
  viewMode: ViewMode;
  isPreviewMode: boolean;
  isMenuCollapsed: boolean;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  // Modules data for editing
  modules: MemberModule[];
  selectedModuleId: string | null;
  isEditingModule: boolean;
}

export interface BuilderActions {
  // Sections CRUD (local only - no DB calls)
  addSection: (type: SectionType, position?: number) => Promise<Section | null>;
  updateSection: (id: string, updates: Partial<Section>) => Promise<void>;
  updateSectionSettings: (id: string, settings: Partial<SectionSettings>) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  reorderSections: (orderedIds: string[]) => Promise<void>;
  duplicateSection: (id: string) => Promise<Section | null>;
  
  // Selection
  selectSection: (id: string | null) => void;
  selectMenuItem: (id: string | null) => void;
  
  // View
  setViewMode: (mode: ViewMode) => void;
  togglePreviewMode: () => void;
  toggleMenuCollapse: () => void;
  
  // Viewport Switching (NEW - Dual Layout)
  setActiveViewport: (viewport: Viewport) => void;
  copyDesktopToMobile: () => void;
  setMobileSynced: (synced: boolean) => void;
  
  // Settings (local only)
  updateSettings: (settings: Partial<MembersAreaBuilderSettings>) => Promise<void>;
  
  // Persistence
  save: () => Promise<boolean>;
  load: () => Promise<void>;
  discard: () => void; // Discard unsaved changes
  
  // Modules (for editing individual module covers)
  loadModules: () => Promise<void>;
  updateModule: (id: string, data: Partial<MemberModule>) => Promise<void>;
  selectModule: (id: string | null) => void;
  setEditingModule: (isEditing: boolean) => void;
}

// =====================================================
// SECTION REGISTRY CONFIG
// =====================================================

export interface SectionConfig<T extends SectionSettings = SectionSettings> {
  type: SectionType;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  maxInstances: number; // -1 = unlimited
  isRequired: boolean; // Cannot be deleted
  canDuplicate: boolean; // Can be duplicated
  defaults: Omit<T, 'type'>;
}

// =====================================================
// DEFAULTS
// =====================================================

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
};

export const DEFAULT_MODULES_SETTINGS: Omit<ModulesSettings, 'type'> = {
  course_id: null,
  show_title: 'always',
  show_progress: true,
  module_order: [],
  hidden_module_ids: [],
  card_size: 'medium', // Default card size
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
