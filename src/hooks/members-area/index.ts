/**
 * Members Area Hooks - Public API
 */

// Main facade hook
export { useMembersArea } from "./useMembersArea";

// Individual hooks for advanced usage
export { useMembersAreaSettings } from "./useMembersAreaSettings";
export { useMembersAreaModules } from "./useMembersAreaModules";
export { useMembersAreaContents } from "./useMembersAreaContents";

// State Machine (replaces Reducer)
export { membersAreaMachine, initialMembersAreaContext } from "./machines";
export type { MembersAreaMachineContext, MembersAreaMachineEvent } from "./machines";

// Types
export * from "./types";
