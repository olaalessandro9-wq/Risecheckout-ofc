/**
 * Members Area Hooks - Public API
 */

// Main facade hook
export { useMembersArea } from "./useMembersArea";

// Individual hooks for advanced usage
export { useMembersAreaSettings } from "./useMembersAreaSettings";
export { useMembersAreaModules } from "./useMembersAreaModules";
export { useMembersAreaContents } from "./useMembersAreaContents";

// Reducer (for advanced usage)
export { membersAreaReducer, INITIAL_MEMBERS_AREA_STATE } from "./membersAreaReducer";
export type { MembersAreaState, MembersAreaAction } from "./membersAreaReducer";

// Types
export * from "./types";
