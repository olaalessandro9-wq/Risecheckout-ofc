/**
 * Members Area Builder - Section Registry
 * Registry Pattern para seções do builder
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import type { 
  SectionType, 
  SectionConfig,
  BannerSettings,
  ModulesSettings,
  CoursesSettings,
  ContinueWatchingSettings,
  TextSettings,
  SpacerSettings,
} from './types/builder.types';

import {
  DEFAULT_BANNER_SETTINGS as BANNER_DEFAULTS,
  DEFAULT_MODULES_SETTINGS as MODULES_DEFAULTS,
  DEFAULT_COURSES_SETTINGS as COURSES_DEFAULTS,
  DEFAULT_CONTINUE_WATCHING_SETTINGS as CONTINUE_DEFAULTS,
  DEFAULT_TEXT_SETTINGS as TEXT_DEFAULTS,
  DEFAULT_SPACER_SETTINGS as SPACER_DEFAULTS,
} from './types/builder.types';

// =====================================================
// SECTION CONFIGURATIONS
// =====================================================

const BannerConfig: SectionConfig<BannerSettings> = {
  type: 'banner',
  label: 'Banner',
  description: 'Slideshow de imagens no topo da página',
  icon: 'Image',
  maxInstances: -1,  // Unlimited banners
  isRequired: false,
  canDuplicate: true, // Can duplicate
  defaults: BANNER_DEFAULTS,
};

const ModulesConfig: SectionConfig<ModulesSettings> = {
  type: 'modules',
  label: 'Módulos',
  description: 'Exibe os módulos de um curso em carrossel',
  icon: 'LayoutGrid',
  maxInstances: -1,
  isRequired: false,
  canDuplicate: true,
  defaults: MODULES_DEFAULTS,
};

const CoursesConfig: SectionConfig<CoursesSettings> = {
  type: 'courses',
  label: 'Cursos',
  description: 'Lista de cursos disponíveis',
  icon: 'BookOpen',
  maxInstances: -1,
  isRequired: false,
  canDuplicate: true,
  defaults: COURSES_DEFAULTS,
};

const ContinueWatchingConfig: SectionConfig<ContinueWatchingSettings> = {
  type: 'continue_watching',
  label: 'Continuar Assistindo',
  description: 'Mostra conteúdos em progresso do aluno',
  icon: 'Play',
  maxInstances: 1,
  isRequired: true, // Required section - cannot be deleted
  canDuplicate: false,
  defaults: CONTINUE_DEFAULTS,
};

const TextConfig: SectionConfig<TextSettings> = {
  type: 'text',
  label: 'Texto',
  description: 'Bloco de texto customizável',
  icon: 'Type',
  maxInstances: -1,
  isRequired: false,
  canDuplicate: true,
  defaults: TEXT_DEFAULTS,
};

const SpacerConfig: SectionConfig<SpacerSettings> = {
  type: 'spacer',
  label: 'Espaçador',
  description: 'Espaço em branco entre seções',
  icon: 'Minus',
  maxInstances: -1,
  isRequired: false,
  canDuplicate: true,
  defaults: SPACER_DEFAULTS,
};

// =====================================================
// REGISTRY
// =====================================================

export const SectionRegistry: Record<SectionType, SectionConfig> = {
  banner: BannerConfig,
  modules: ModulesConfig,
  courses: CoursesConfig,
  continue_watching: ContinueWatchingConfig,
  text: TextConfig,
  spacer: SpacerConfig,
};

// =====================================================
// HELPERS
// =====================================================

export function getSectionConfig(type: SectionType): SectionConfig {
  return SectionRegistry[type];
}

export function getSectionLabel(type: SectionType): string {
  return SectionRegistry[type].label;
}

export function getSectionIcon(type: SectionType): string {
  return SectionRegistry[type].icon;
}

export function getSectionDefaults(type: SectionType): Record<string, unknown> {
  return { type, ...SectionRegistry[type].defaults };
}

export function canAddSection(type: SectionType, currentSections: { type: SectionType }[]): boolean {
  const config = SectionRegistry[type];
  if (config.maxInstances === -1) return true;
  
  const count = currentSections.filter(s => s.type === type).length;
  return count < config.maxInstances;
}

export function canDeleteSection(type: SectionType): boolean {
  return !SectionRegistry[type].isRequired;
}

export function canDuplicateSection(type: SectionType): boolean {
  return SectionRegistry[type].canDuplicate;
}

export function isRequiredSection(type: SectionType): boolean {
  return SectionRegistry[type].isRequired;
}

export function getAvailableSectionTypes(currentSections: { type: SectionType }[]): SectionType[] {
  return (Object.keys(SectionRegistry) as SectionType[]).filter(
    type => canAddSection(type, currentSections)
  );
}

export function getRequiredSectionTypes(): SectionType[] {
  return (Object.keys(SectionRegistry) as SectionType[]).filter(
    type => SectionRegistry[type].isRequired
  );
}
