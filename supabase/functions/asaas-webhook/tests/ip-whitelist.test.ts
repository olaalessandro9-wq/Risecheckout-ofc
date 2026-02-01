/**
 * Unit Tests - IP Whitelist
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 1: IP validation tests
 * Execution: ALWAYS
 * 
 * @module asaas-webhook/tests/ip-whitelist
 * @version 1.0.0
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  unitTestOptions,
  ASAAS_IP_WHITELIST,
} from "./_shared.ts";

// ============================================================================
// IP WHITELIST TESTS
// ============================================================================

Deno.test({
  name: "asaas-webhook/ip-whitelist: whitelist contains expected IPs",
  ...unitTestOptions,
  fn: () => {
    assertEquals(ASAAS_IP_WHITELIST.length > 0, true);
    assertEquals(ASAAS_IP_WHITELIST.includes("54.94.52.238"), true);
    assertEquals(ASAAS_IP_WHITELIST.includes("54.207.14.161"), true);
  }
});

Deno.test({
  name: "asaas-webhook/ip-whitelist: all IPs are valid IPv4 format",
  ...unitTestOptions,
  fn: () => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    
    for (const ip of ASAAS_IP_WHITELIST) {
      assertEquals(ipv4Regex.test(ip), true, `Invalid IP format: ${ip}`);
    }
  }
});

Deno.test({
  name: "asaas-webhook/ip-whitelist: all IPs have valid octets",
  ...unitTestOptions,
  fn: () => {
    for (const ip of ASAAS_IP_WHITELIST) {
      const octets = ip.split(".").map(Number);
      for (const octet of octets) {
        assertEquals(octet >= 0 && octet <= 255, true, `Invalid octet in IP: ${ip}`);
      }
    }
  }
});

Deno.test({
  name: "asaas-webhook/ip-whitelist: random IP is not in whitelist",
  ...unitTestOptions,
  fn: () => {
    const randomIP = "192.168.1.1";
    assertEquals(ASAAS_IP_WHITELIST.includes(randomIP as typeof ASAAS_IP_WHITELIST[number]), false);
  }
});

Deno.test({
  name: "asaas-webhook/ip-whitelist: localhost is not in whitelist",
  ...unitTestOptions,
  fn: () => {
    const localhost = "127.0.0.1";
    assertEquals(ASAAS_IP_WHITELIST.includes(localhost as typeof ASAAS_IP_WHITELIST[number]), false);
  }
});

// ============================================================================
// IP VALIDATION LOGIC TESTS
// ============================================================================

Deno.test({
  name: "asaas-webhook/ip-whitelist: can check if IP is whitelisted",
  ...unitTestOptions,
  fn: () => {
    const isWhitelisted = (ip: string): boolean => {
      return ASAAS_IP_WHITELIST.includes(ip as typeof ASAAS_IP_WHITELIST[number]);
    };
    
    assertEquals(isWhitelisted("54.94.52.238"), true);
    assertEquals(isWhitelisted("10.0.0.1"), false);
  }
});

Deno.test({
  name: "asaas-webhook/ip-whitelist: X-Forwarded-For parsing simulation",
  ...unitTestOptions,
  fn: () => {
    // Simulate extracting client IP from X-Forwarded-For header
    const getClientIP = (xForwardedFor: string | null): string | null => {
      if (!xForwardedFor) return null;
      const ips = xForwardedFor.split(",").map(ip => ip.trim());
      return ips[0] || null;
    };
    
    // Single IP
    assertEquals(getClientIP("54.94.52.238"), "54.94.52.238");
    
    // Multiple IPs (proxy chain)
    assertEquals(getClientIP("54.94.52.238, 10.0.0.1, 172.16.0.1"), "54.94.52.238");
    
    // Null header
    assertEquals(getClientIP(null), null);
  }
});
