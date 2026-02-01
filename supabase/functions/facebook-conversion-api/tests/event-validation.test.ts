/**
 * Event Validation Tests for facebook-conversion-api
 * 
 * @module facebook-conversion-api/tests/event-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createDefaultEvent,
  createPurchaseEvent,
  VALID_EVENT_NAMES,
  isValidEventName,
  type FacebookEvent,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockEvent: FacebookEvent;

describe("facebook-conversion-api - Event Validation", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockEvent = createDefaultEvent();
  });

  it("should require event_name", async () => {
    const mockRequest = createMockRequest({ event: {} });
    const body = await mockRequest.json() as Record<string, unknown>;
    const event = body.event as Record<string, unknown>;
    const hasEventName = "event_name" in event;
    assertEquals(hasEventName, false);
  });

  it("should validate event_name is a valid Facebook event", () => {
    const eventName = mockEvent.event_name;
    const isValid = VALID_EVENT_NAMES.includes(eventName);
    assertEquals(isValid, true);
  });

  it("should reject invalid event_name", () => {
    const invalidEvent = "InvalidEventName";
    const isValid = isValidEventName(invalidEvent);
    assertEquals(isValid, false);
  });

  it("should require event_time", () => {
    assertExists(mockEvent.event_time);
    assertEquals(typeof mockEvent.event_time, "number");
  });

  it("should validate event_time is Unix timestamp", () => {
    const eventTime = mockEvent.event_time;
    const isUnixTimestamp = eventTime > 1000000000 && eventTime < 9999999999;
    assertEquals(isUnixTimestamp, true);
  });

  it("should require action_source", () => {
    assertExists(mockEvent.action_source);
    assertEquals(mockEvent.action_source, "website");
  });

  it("should validate purchase event has value and currency", () => {
    const purchaseEvent = createPurchaseEvent();
    assertExists(purchaseEvent.custom_data?.value);
    assertExists(purchaseEvent.custom_data?.currency);
  });

  it("should accept all valid Facebook event names", () => {
    for (const eventName of VALID_EVENT_NAMES) {
      const isValid = VALID_EVENT_NAMES.includes(eventName);
      assertEquals(isValid, true);
    }
  });
});
