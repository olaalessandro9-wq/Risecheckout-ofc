/**
 * Track Visit API MSW Handlers
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Mock handlers for track-visit edge function.
 * Used by useVisitTracker hook.
 * 
 * @module test/mocks/handlers/track-visit-handlers
 */

import { http, HttpResponse } from "msw";

// ============================================================================
// Constants
// ============================================================================

const API_URL = "https://api.risecheckout.com/functions/v1";

// ============================================================================
// Mock Data
// ============================================================================

export const mockTrackVisitResponse = {
  success: true,
  visitId: "visit-123",
  sessionId: "session-456",
};

export const mockTrackVisitErrorResponse = {
  success: false,
  error: "Failed to track visit",
};

// ============================================================================
// Request Body Types
// ============================================================================

interface TrackVisitRequest {
  checkoutId: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  userAgent?: string;
}

// ============================================================================
// Handlers
// ============================================================================

export const trackVisitHandlers = [
  http.post(`${API_URL}/track-visit`, async ({ request }) => {
    const body = (await request.json()) as TrackVisitRequest;

    // Validate checkoutId
    if (!body.checkoutId) {
      return HttpResponse.json(
        {
          success: false,
          error: "Checkout ID is required",
        },
        { status: 400 }
      );
    }

    // Simulate error for specific checkout IDs
    if (body.checkoutId === "error") {
      return HttpResponse.json(
        mockTrackVisitErrorResponse,
        { status: 500 }
      );
    }

    // Simulate timeout for specific checkout IDs
    if (body.checkoutId === "timeout") {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      return HttpResponse.json(mockTrackVisitResponse);
    }

    // Normal success response
    return HttpResponse.json({
      ...mockTrackVisitResponse,
      visitId: `visit-${Date.now()}`,
      sessionId: `session-${Date.now()}`,
      utm: {
        source: body.utm_source ?? null,
        medium: body.utm_medium ?? null,
        campaign: body.utm_campaign ?? null,
        content: body.utm_content ?? null,
        term: body.utm_term ?? null,
      },
    });
  }),
];
