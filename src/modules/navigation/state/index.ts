/**
 * Navigation State - Barrel Export
 * 
 * @module navigation/state
 * @deprecated Use machines/index.ts para State Machine XState
 * 
 * Este arquivo existe apenas para manter compatibilidade.
 * Toda a lógica de estado foi migrada para XState.
 */

// Re-export from machines for backwards compatibility
export { 
  navigationMachine,
  createInitialNavigationContext,
} from "../machines";
