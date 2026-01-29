/**
 * XState Testing Utilities
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Helper utilities for testing XState v5 state machines.
 * Provides type-safe test helpers for transitions, guards, and state assertions.
 * 
 * @module test/xstate-utils
 */

import { createActor, type AnyStateMachine, type AnyActorRef } from "xstate";

// ============================================================================
// TYPES
// ============================================================================

export interface TransitionTestResult {
  readonly initialState: string;
  readonly event: { type: string };
  readonly finalState: string;
  readonly context: unknown;
  readonly matches: (stateValue: string) => boolean;
}

export interface ActorTestOptions {
  readonly timeout?: number;
}

// ============================================================================
// STATE MACHINE TESTING
// ============================================================================

/**
 * Get current state value as string from any actor
 */
export function getStateValue(actor: AnyActorRef): string {
  const snapshot = actor.getSnapshot();
  if (snapshot && typeof snapshot === "object" && "value" in snapshot) {
    const value = (snapshot as { value: string | object }).value;
    return typeof value === "string" ? value : JSON.stringify(value);
  }
  return "unknown";
}

/**
 * Assert that a machine is in a specific state
 */
export function assertState(
  actor: AnyActorRef,
  expectedState: string
): void {
  const snapshot = actor.getSnapshot();
  
  if (snapshot && typeof snapshot === "object" && "matches" in snapshot) {
    const matches = (snapshot as { matches: (s: string) => boolean }).matches;
    if (!matches(expectedState)) {
      const currentState = getStateValue(actor);
      throw new Error(
        `Expected state "${expectedState}" but got "${currentState}"`
      );
    }
  }
}

/**
 * Wait for a machine to reach a specific state
 */
export async function waitForState(
  actor: AnyActorRef,
  targetState: string,
  options: ActorTestOptions = {}
): Promise<void> {
  const { timeout = 5000 } = options;
  
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      subscription.unsubscribe();
      const currentState = getStateValue(actor);
      reject(new Error(
        `Timeout waiting for state "${targetState}". Current state: "${currentState}"`
      ));
    }, timeout);
    
    const subscription = actor.subscribe((snapshot) => {
      if (snapshot && typeof snapshot === "object" && "matches" in snapshot) {
        const matches = (snapshot as { matches: (s: string) => boolean }).matches;
        if (matches(targetState)) {
          clearTimeout(timeoutId);
          subscription.unsubscribe();
          resolve();
        }
      }
    });
    
    // Check immediately
    const currentSnapshot = actor.getSnapshot();
    if (currentSnapshot && typeof currentSnapshot === "object" && "matches" in currentSnapshot) {
      const matches = (currentSnapshot as { matches: (s: string) => boolean }).matches;
      if (matches(targetState)) {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
        resolve();
      }
    }
  });
}

/**
 * Verify a sequence of transitions
 */
export function verifyTransitionSequence<TMachine extends AnyStateMachine>(
  machine: TMachine,
  sequence: Array<{
    event: { type: string; [key: string]: unknown };
    expectedState: string;
  }>
): boolean {
  const actor = createActor(machine);
  actor.start();
  
  try {
    for (const step of sequence) {
      // Cast event to any for generic usage
      actor.send(step.event as Parameters<typeof actor.send>[0]);
      const snapshot = actor.getSnapshot();
      
      if (snapshot && typeof snapshot === "object" && "matches" in snapshot) {
        const matches = (snapshot as { matches: (s: string) => boolean }).matches;
        if (!matches(step.expectedState)) {
          const currentState = getStateValue(actor);
          throw new Error(
            `After event "${step.event.type}", expected state "${step.expectedState}" but got "${currentState}"`
          );
        }
      }
    }
    return true;
  } finally {
    actor.stop();
  }
}
