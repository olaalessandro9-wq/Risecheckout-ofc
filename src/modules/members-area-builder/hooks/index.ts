/**
 * Members Area Builder Hooks - Barrel Export
 * 
 * Uses XState State Machine as Single Source of Truth.
 * Legacy Reducer and hooks have been removed.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
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
export { parseSections, parseSettings } from './useMembersAreaParsers';

// State Machine exports (replaces Reducer)
export { builderMachine } from '../machines';
export type { BuilderMachineEvent } from '../machines/builderMachine.types';
