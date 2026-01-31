/**
 * XState Test Factories
 * 
 * Type-safe factory functions for mocking XState machine states.
 * 
 * @module test/factories/xstate
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// GENERIC XSTATE MACHINE MOCK
// ============================================================================

/**
 * Generic type for useMachine return value
 */
export interface MockUseMachineReturn<TContext, TEvent extends { type: string }> {
  snapshot: MockMachineSnapshot<TContext>;
  send: (event: TEvent) => void;
  actorRef: unknown;
}

/**
 * Generic snapshot type for XState machines
 */
export interface MockMachineSnapshot<TContext> {
  context: TContext;
  value: string | Record<string, unknown>;
  matches: (stateValue: string) => boolean;
  can: (event: { type: string }) => boolean;
  status: "active" | "done" | "error" | "stopped";
  error?: Error;
}

/**
 * Creates a type-safe mock for useMachine hook return value
 */
export function createMockUseMachine<TContext, TEvent extends { type: string }>(
  context: TContext,
  stateValue: string | Record<string, unknown> = "ready",
  overrides?: Partial<MockMachineSnapshot<TContext>>
): [MockMachineSnapshot<TContext>, (event: TEvent) => void] {
  const mockSend = vi.fn();

  const snapshot: MockMachineSnapshot<TContext> = {
    context,
    value: stateValue,
    matches: vi.fn((state: string) => {
      if (typeof stateValue === "string") {
        return state === stateValue;
      }
      return Object.keys(stateValue).includes(state);
    }),
    can: vi.fn(() => true),
    status: "active",
    ...overrides,
  };

  return [snapshot, mockSend];
}

/**
 * Creates a mock snapshot for XState machines
 */
export function createMockSnapshot<TContext>(
  context: TContext,
  stateValue: string | Record<string, unknown> = "ready",
  overrides?: Partial<MockMachineSnapshot<TContext>>
): MockMachineSnapshot<TContext> {
  return {
    context,
    value: stateValue,
    matches: vi.fn((state: string) => {
      if (typeof stateValue === "string") {
        return state === stateValue;
      }
      return Object.keys(stateValue).includes(state);
    }),
    can: vi.fn(() => true),
    status: "active",
    ...overrides,
  };
}

// ============================================================================
// STATE MATCHING UTILITIES
// ============================================================================

/**
 * Creates a matches function that handles nested state values
 */
export function createMatchesFn(
  stateValue: string | Record<string, unknown>
): (state: string) => boolean {
  return (state: string): boolean => {
    if (typeof stateValue === "string") {
      return state === stateValue;
    }
    // For nested states like { ready: "idle" }
    const topLevelStates = Object.keys(stateValue);
    if (topLevelStates.includes(state)) {
      return true;
    }
    // Check nested values
    for (const topLevel of topLevelStates) {
      const nested = stateValue[topLevel];
      if (typeof nested === "string" && nested === state) {
        return true;
      }
    }
    return false;
  };
}
