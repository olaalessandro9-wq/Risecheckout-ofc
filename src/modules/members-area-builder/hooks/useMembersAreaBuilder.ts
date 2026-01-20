/**
 * Members Area Builder - Main Orchestrator Hook
 * 
 * Now uses XState State Machine via useMembersAreaState.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 */

import type { BuilderState, BuilderActions } from '../types/builder.types';
import { useMembersAreaState } from './useMembersAreaState';

interface UseMembersAreaBuilderReturn {
  state: BuilderState;
  actions: BuilderActions;
}

/**
 * Main orchestrator hook for Members Area Builder
 * Now delegates to XState-based useMembersAreaState
 */
export function useMembersAreaBuilder(productId: string | undefined): UseMembersAreaBuilderReturn {
  return useMembersAreaState(productId);
}
