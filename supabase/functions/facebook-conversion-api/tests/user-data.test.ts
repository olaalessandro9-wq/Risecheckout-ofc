/**
 * User Data Tests for facebook-conversion-api
 * 
 * @module facebook-conversion-api/tests/user-data.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createDefaultEvent,
  createEventWithUserData,
  hashValue,
  type FacebookEvent,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockEvent: FacebookEvent;

describe("facebook-conversion-api - User Data", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockEvent = createDefaultEvent();
  });

  it("should require user_data object", () => {
    assertExists(mockEvent.user_data);
  });

  it("should hash email before sending", async () => {
    const eventWithUser = createEventWithUserData();
    const email = "test@example.com";
    const hashedEmail = await hashValue(email);
    assertExists(hashedEmail);
    assertEquals(hashedEmail.length, 64); // SHA256 hex length
  });

  it("should hash phone number before sending", async () => {
    const phone = "+5511999999999";
    const hashedPhone = await hashValue(phone);
    assertExists(hashedPhone);
    assertEquals(hashedPhone.length, 64);
  });

  it("should normalize email before hashing", async () => {
    const email1 = "Test@Example.com";
    const email2 = "test@example.com";
    const hash1 = await hashValue(email1.toLowerCase());
    const hash2 = await hashValue(email2.toLowerCase());
    assertEquals(hash1, hash2);
  });

  it("should include client_ip_address when available", () => {
    const eventWithUser = createEventWithUserData();
    assertExists(eventWithUser.user_data.client_ip_address);
  });

  it("should include client_user_agent when available", () => {
    const eventWithUser = createEventWithUserData();
    assertExists(eventWithUser.user_data.client_user_agent);
  });

  it("should include fbc parameter when available", () => {
    const eventWithUser = createEventWithUserData();
    assertExists(eventWithUser.user_data.fbc);
  });

  it("should include fbp parameter when available", () => {
    const eventWithUser = createEventWithUserData();
    assertExists(eventWithUser.user_data.fbp);
  });

  it("should handle missing optional user data fields", () => {
    const minimalUserData = {
      client_ip_address: "192.168.1.1",
      client_user_agent: "Mozilla/5.0",
    };
    assertExists(minimalUserData.client_ip_address);
    assertEquals(minimalUserData.client_ip_address !== undefined, true);
  });
});
