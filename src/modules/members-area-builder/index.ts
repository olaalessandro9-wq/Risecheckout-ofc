/**
 * Members Area Builder - Public API
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

// Page
export { MembersAreaBuilderPage } from './pages/MembersAreaBuilderPage';

// Hooks
export { useMembersAreaBuilder } from './hooks/useMembersAreaBuilder';

// Types
export type {
  SectionType,
  Section,
  SectionSettings,
  BannerSettings,
  ModulesSettings,
  CoursesSettings,
  ContinueWatchingSettings,
  TextSettings,
  SpacerSettings,
  MembersAreaBuilderSettings,
  BuilderState,
  BuilderActions,
  ViewMode,
  MemberModule,
} from './types/builder.types';

// Registry
export { 
  SectionRegistry, 
  getSectionConfig, 
  getSectionLabel,
  getSectionIcon,
  canAddSection,
  getAvailableSectionTypes,
} from './registry';
