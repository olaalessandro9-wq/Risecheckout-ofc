/**
 * Members Area Builder Hooks - Barrel Export
 * 
 * @see RISE ARCHITECT PROTOCOL V3
 */

export { useMembersAreaBuilder } from './useMembersAreaBuilder';
export { 
  useMembersAreaState, 
  VALID_SECTION_TYPES, 
  isSectionType, 
  isTemporaryId,
  createDefaultSection,
} from './useMembersAreaState';
export type { RawSectionRow, UseMembersAreaStateReturn } from './useMembersAreaState';
export { useMembersAreaSections } from './useMembersAreaSections';
export { useMembersAreaPersistence } from './useMembersAreaPersistence';
export { useMembersAreaView } from './useMembersAreaView';
export { useMembersAreaModulesEdit } from './useMembersAreaModulesEdit';
export { parseSections, parseSettings } from './useMembersAreaParsers';

// State Machine exports (replaces Reducer)
export { builderMachine } from '../machines';
export type { BuilderMachineEvent } from '../machines/builderMachine.types';
