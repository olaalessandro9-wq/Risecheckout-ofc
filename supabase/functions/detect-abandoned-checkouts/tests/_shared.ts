/**
 * Shared Test Infrastructure for detect-abandoned-checkouts
 * 
 * @module detect-abandoned-checkouts/tests/_shared
 * @version 2.0.0 - Type-safe factories (zero 'as never')
 * RISE Protocol V3 Compliant
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "detect-abandoned-checkouts";
export const ABANDONMENT_THRESHOLD_MINUTES = 30;

// ============================================================================
// TYPES
// ============================================================================

export interface AbandonedSession {
  id: string;
  status: string;
  last_seen_at: string | null;
  order_id?: string | null;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isAbandoned(session: AbandonedSession): boolean {
  return session.status === "active" && session.order_id === null;
}

export function shouldBeMarkedAbandoned(session: AbandonedSession, thresholdTime: Date): boolean {
  if (!session.last_seen_at) return false;
  return new Date(session.last_seen_at) < thresholdTime;
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export function createMockRequest(): Request {
  const url = `https://test.supabase.co/functions/v1/${FUNCTION_NAME}`;
  return new Request(url, {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
  });
}

export function createMockSupabaseClient(abandonedSessions: AbandonedSession[] = []): Record<string, unknown> {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          lt: () => ({
            is: () => Promise.resolve({ data: abandonedSessions, error: null }),
          }),
        }),
      }),
      update: () => ({
        in: () => Promise.resolve({ error: null }),
      }),
    }),
  };
}

export function createAbandonedSession(overrides: Partial<AbandonedSession> = {}): AbandonedSession {
  return {
    id: `session-${Date.now()}`,
    status: "active",
    last_seen_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    order_id: null,
    ...overrides,
  };
}

export function getThresholdTime(): Date {
  return new Date(Date.now() - ABANDONMENT_THRESHOLD_MINUTES * 60 * 1000);
}
