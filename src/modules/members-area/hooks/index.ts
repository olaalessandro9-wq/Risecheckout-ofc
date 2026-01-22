/**
 * Members Area Hooks - Public Exports
 * 
 * Centralized exports for all Members Area hooks.
 * This is the Single Source of Truth for hooks in this module.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - SSOT
 */

// Main facade hook
export { useMembersArea } from "./useMembersArea";

// Individual hooks for advanced usage
export { useMembersAreaSettings, membersAreaQueryKeys } from "./useMembersAreaSettings";
export { useMembersAreaModules } from "./useMembersAreaModules";
export { useMembersAreaContents } from "./useMembersAreaContents";

// Domain-specific hooks
export { useGroups } from "./useGroups";
export { useStudentProgress } from "./useStudentProgress";
export { useContentDrip } from "./useContentDrip";
export { useQuizzes } from "./useQuizzes";
export { useCertificates } from "./useCertificates";
export { useStudentsData } from "./useStudentsData";
export { useStudentsActions } from "./useStudentsActions";
export { useVideoLibrary } from "./useVideoLibrary";
export { useContentEditorData } from "./useContentEditorData";

// State Machine
export { membersAreaMachine, initialMembersAreaContext } from "./machines";
export type { MembersAreaMachineContext, MembersAreaMachineEvent } from "./machines";

// Types
export * from "./types";
