/**
 * @file _helpers.tsx
 * @description Test helpers for Checkout Public module
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { createActor, type AnyStateMachine } from "xstate";

// ============================================================================
// RENDER WITH XSTATE
// ============================================================================

/**
 * Creates a test QueryClient with no retries
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

/**
 * Renders a component with all necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// ============================================================================
// XSTATE MACHINE HELPERS
// ============================================================================

/**
 * Creates and starts an actor for testing
 */
export function createTestActor<TMachine extends AnyStateMachine>(
  machine: TMachine,
  input?: Parameters<typeof createActor<TMachine>>[1]
) {
  const actor = createActor(machine, input);
  actor.start();
  return actor;
}

/**
 * Gets the current state value from an actor
 */
export function getActorState(actor: ReturnType<typeof createTestActor>) {
  const snapshot = actor.getSnapshot();
  if (snapshot && typeof snapshot === "object" && "value" in snapshot) {
    return (snapshot as { value: string | object }).value;
  }
  return "unknown";
}

/**
 * Waits for an actor to reach a specific state
 */
export async function waitForActorState(
  actor: ReturnType<typeof createTestActor>,
  targetState: string,
  timeout = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      subscription.unsubscribe();
      const currentState = getActorState(actor);
      reject(
        new Error(
          `Timeout waiting for state "${targetState}". Current: "${currentState}"`
        )
      );
    }, timeout);

    const subscription = actor.subscribe((snapshot) => {
      if (snapshot && typeof snapshot === "object" && "matches" in snapshot) {
        const matches = (snapshot as { matches: (s: string) => boolean })
          .matches;
        if (matches(targetState)) {
          clearTimeout(timeoutId);
          subscription.unsubscribe();
          resolve();
        }
      }
    });

    // Check immediately
    const currentSnapshot = actor.getSnapshot();
    if (
      currentSnapshot &&
      typeof currentSnapshot === "object" &&
      "matches" in currentSnapshot
    ) {
      const matches = (
        currentSnapshot as { matches: (s: string) => boolean }
      ).matches;
      if (matches(targetState)) {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
        resolve();
      }
    }
  });
}

// ============================================================================
// MOCK API RESPONSES
// ============================================================================

/**
 * Creates a mock API response
 */
export function createMockApiResponse<T>(data: T, error: string | null = null) {
  return {
    data: error ? null : data,
    error: error ? { message: error } : null,
  };
}

/**
 * Creates a mock fetch function
 */
export function createMockFetch(response: unknown, shouldFail = false) {
  return vi.fn(async () => {
    if (shouldFail) {
      throw new Error("Network error");
    }
    return response;
  });
}

// ============================================================================
// FORM HELPERS
// ============================================================================

/**
 * Fills a form field
 */
export async function fillFormField(
  container: HTMLElement,
  labelText: string,
  value: string
) {
  const { fireEvent } = await import("@testing-library/react");
  const input = container.querySelector(
    `input[aria-label="${labelText}"], input[placeholder*="${labelText}"]`
  ) as HTMLInputElement;
  if (input) {
    fireEvent.change(input, { target: { value } });
  }
}

/**
 * Submits a form
 */
export async function submitForm(container: HTMLElement) {
  const { fireEvent } = await import("@testing-library/react");
  const form = container.querySelector("form");
  if (form) {
    fireEvent.submit(form);
  }
}

// ============================================================================
// WAIT HELPERS
// ============================================================================

/**
 * Waits for async operations
 */
export const waitForAsync = (ms = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Waits for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 5000
): Promise<void> {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error("Timeout waiting for condition");
    }
    await waitForAsync(50);
  }
}
