/**
 * useDeferredTracking Hook
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Executes tracking callbacks during browser idle time.
 * This prevents tracking from blocking the main thread
 * and impacting Time to Interactive (TTI).
 * 
 * Uses requestIdleCallback when available, with setTimeout fallback.
 * 
 * @module hooks/checkout
 */

import { useEffect, useRef, useCallback } from "react";

// ============================================================================
// TYPES
// ============================================================================

interface IdleDeadline {
  didTimeout: boolean;
  timeRemaining: () => number;
}

interface IdleCallbackOptions {
  timeout?: number;
}

// Extended window type for requestIdleCallback (not in all browsers)
interface IdleCallbackCapable {
  requestIdleCallback?: (
    callback: (deadline: IdleDeadline) => void,
    options?: IdleCallbackOptions
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
}

/**
 * Type-safe access to window with idle callback support
 */
function getIdleWindow(): (Window & IdleCallbackCapable) | undefined {
  if (typeof window !== 'undefined') {
    return window as Window & IdleCallbackCapable;
  }
  return undefined;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default timeout for requestIdleCallback (2 seconds) */
const DEFAULT_IDLE_TIMEOUT = 2000;

/** Fallback delay when requestIdleCallback is not available */
const FALLBACK_DELAY = 100;

// ============================================================================
// HOOK
// ============================================================================

/**
 * Executes a callback during browser idle time.
 * 
 * This is ideal for non-critical operations like:
 * - Analytics/tracking
 * - Prefetching
 * - Background logging
 * 
 * @param callback - Function to execute during idle time
 * @param deps - Dependency array (like useEffect)
 * @param options - Configuration options
 * 
 * @example
 * ```typescript
 * useDeferredTracking(() => {
 *   trackPageView(checkoutId);
 * }, [checkoutId]);
 * ```
 */
export function useDeferredTracking(
  callback: () => void | Promise<void>,
  deps: unknown[],
  options: { timeout?: number } = {}
): void {
  const { timeout = DEFAULT_IDLE_TIMEOUT } = options;
  const hasExecuted = useRef(false);

  useEffect(() => {
    // Prevent double execution
    if (hasExecuted.current) return;

    const idleWindow = getIdleWindow();

    // Use requestIdleCallback if available
    if (idleWindow?.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(
        () => {
          if (!hasExecuted.current) {
            hasExecuted.current = true;
            callback();
          }
        },
        { timeout }
      );

      return () => {
        idleWindow?.cancelIdleCallback?.(handle);
      };
    }

    // Fallback for Safari and older browsers
    const timeoutId = setTimeout(() => {
      if (!hasExecuted.current) {
        hasExecuted.current = true;
        callback();
      }
    }, FALLBACK_DELAY);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Creates a deferred execution function.
 * 
 * Unlike useDeferredTracking, this returns a function that can be
 * called manually. The execution will still be deferred to idle time.
 * 
 * @param callback - Function to execute
 * @param timeout - Maximum time to wait for idle (default: 2000ms)
 * @returns Deferred function
 * 
 * @example
 * ```typescript
 * const deferredTrack = useDeferredCallback(() => {
 *   trackEvent('button_click');
 * });
 * 
 * // Later, on button click:
 * deferredTrack();
 * ```
 */
export function useDeferredCallback(
  callback: () => void | Promise<void>,
  timeout: number = DEFAULT_IDLE_TIMEOUT
): () => void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(() => {
    const idleWindow = getIdleWindow();
    if (idleWindow?.requestIdleCallback) {
      idleWindow.requestIdleCallback(
        () => callbackRef.current(),
        { timeout }
      );
    } else {
      setTimeout(() => callbackRef.current(), FALLBACK_DELAY);
    }
  }, [timeout]);
}

/**
 * Queues multiple tracking calls to execute in sequence during idle time.
 * 
 * Useful when you need to fire multiple tracking events without
 * blocking the main thread.
 * 
 * @param queue - Array of tracking functions
 * @param deps - Dependency array
 */
export function useDeferredTrackingQueue(
  queue: Array<() => void | Promise<void>>,
  deps: unknown[]
): void {
  useEffect(() => {
    if (queue.length === 0) return;

    const idleWindow = getIdleWindow();
    let currentIndex = 0;

    const executeNext = () => {
      if (currentIndex >= queue.length) return;

      const fn = queue[currentIndex];
      currentIndex++;

      // Execute current and schedule next
      try {
        fn();
      } catch {
        // Don't let tracking errors break the queue
      }

      // Schedule next item
      if (currentIndex < queue.length) {
        if (idleWindow?.requestIdleCallback) {
          idleWindow.requestIdleCallback(executeNext, { timeout: DEFAULT_IDLE_TIMEOUT });
        } else {
          setTimeout(executeNext, FALLBACK_DELAY);
        }
      }
    };

    // Start the queue
    if (idleWindow?.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(executeNext, { timeout: DEFAULT_IDLE_TIMEOUT });
      return () => idleWindow.cancelIdleCallback?.(handle);
    } else {
      const id = setTimeout(executeNext, FALLBACK_DELAY);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
