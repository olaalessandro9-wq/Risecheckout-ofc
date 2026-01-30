/**
 * Unit Tests for IP Whitelist Helper
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - IP extraction from various headers
 * - Asaas IP whitelist validation
 * - Edge cases (null IPs, proxied requests)
 * 
 * @module _shared/ip-whitelist.test
 */

import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { 
  getClientIP, 
  isAsaasIP, 
  validateAsaasIP, 
  ASAAS_OFFICIAL_IPS 
} from "./ip-whitelist.ts";

// ============================================================================
// getClientIP Tests
// ============================================================================

Deno.test("getClientIP: Deve extrair IP do header CF-Connecting-IP", () => {
  const req = new Request("https://example.com", {
    headers: {
      'cf-connecting-ip': '203.0.113.50'
    }
  });

  const ip = getClientIP(req);
  assertEquals(ip, '203.0.113.50');
});

Deno.test("getClientIP: Deve extrair IP do header X-Forwarded-For", () => {
  const req = new Request("https://example.com", {
    headers: {
      'x-forwarded-for': '203.0.113.100, 10.0.0.1, 10.0.0.2'
    }
  });

  const ip = getClientIP(req);
  assertEquals(ip, '203.0.113.100');
});

Deno.test("getClientIP: Deve extrair IP do header X-Real-IP", () => {
  const req = new Request("https://example.com", {
    headers: {
      'x-real-ip': '203.0.113.75'
    }
  });

  const ip = getClientIP(req);
  assertEquals(ip, '203.0.113.75');
});

Deno.test("getClientIP: Deve priorizar CF-Connecting-IP sobre X-Forwarded-For", () => {
  const req = new Request("https://example.com", {
    headers: {
      'cf-connecting-ip': '203.0.113.50',
      'x-forwarded-for': '203.0.113.100'
    }
  });

  const ip = getClientIP(req);
  assertEquals(ip, '203.0.113.50');
});

Deno.test("getClientIP: Deve retornar null se nenhum header presente", () => {
  const req = new Request("https://example.com");
  const ip = getClientIP(req);
  assertEquals(ip, null);
});

Deno.test("getClientIP: Deve lidar com X-Forwarded-For com espaços", () => {
  const req = new Request("https://example.com", {
    headers: {
      'x-forwarded-for': '  203.0.113.100  ,  10.0.0.1  '
    }
  });

  const ip = getClientIP(req);
  assertEquals(ip, '203.0.113.100');
});

// ============================================================================
// isAsaasIP Tests
// ============================================================================

Deno.test("isAsaasIP: Deve retornar true para IPs oficiais do Asaas", () => {
  for (const ip of ASAAS_OFFICIAL_IPS) {
    assertEquals(isAsaasIP(ip), true, `IP ${ip} deveria ser reconhecido`);
  }
});

Deno.test("isAsaasIP: Deve retornar false para IPs não autorizados", () => {
  const unauthorizedIPs = [
    '203.0.113.1',
    '10.0.0.1',
    '192.168.1.1',
    '8.8.8.8',
    '1.1.1.1'
  ];

  for (const ip of unauthorizedIPs) {
    assertEquals(isAsaasIP(ip), false, `IP ${ip} não deveria ser autorizado`);
  }
});

Deno.test("isAsaasIP: Deve retornar false para null", () => {
  assertEquals(isAsaasIP(null), false);
});

Deno.test("isAsaasIP: Deve retornar false para string vazia", () => {
  assertEquals(isAsaasIP(''), false);
});

// ============================================================================
// validateAsaasIP Tests
// ============================================================================

Deno.test("validateAsaasIP: Deve validar IP autorizado com enforceWhitelist=true", () => {
  const req = new Request("https://example.com", {
    headers: {
      'cf-connecting-ip': ASAAS_OFFICIAL_IPS[0]
    }
  });

  const result = validateAsaasIP(req, true);
  
  assertEquals(result.isValid, true);
  assertEquals(result.clientIP, ASAAS_OFFICIAL_IPS[0]);
  assertEquals(result.reason, undefined);
});

Deno.test("validateAsaasIP: Deve rejeitar IP não autorizado com enforceWhitelist=true", () => {
  const req = new Request("https://example.com", {
    headers: {
      'cf-connecting-ip': '203.0.113.100'
    }
  });

  const result = validateAsaasIP(req, true);
  
  assertEquals(result.isValid, false);
  assertEquals(result.clientIP, '203.0.113.100');
  assertEquals(typeof result.reason, 'string');
});

Deno.test("validateAsaasIP: Deve permitir IP não autorizado com enforceWhitelist=false", () => {
  const req = new Request("https://example.com", {
    headers: {
      'cf-connecting-ip': '203.0.113.100'
    }
  });

  const result = validateAsaasIP(req, false);
  
  assertEquals(result.isValid, true);
  assertEquals(result.clientIP, '203.0.113.100');
  assertEquals(typeof result.reason, 'string'); // Reason ainda é preenchido para logging
});

Deno.test("validateAsaasIP: Deve rejeitar request sem IP com enforceWhitelist=true", () => {
  const req = new Request("https://example.com");

  const result = validateAsaasIP(req, true);
  
  assertEquals(result.isValid, false);
  assertEquals(result.clientIP, null);
  assertEquals(typeof result.reason, 'string');
});

Deno.test("validateAsaasIP: Deve permitir request sem IP com enforceWhitelist=false", () => {
  const req = new Request("https://example.com");

  const result = validateAsaasIP(req, false);
  
  assertEquals(result.isValid, true);
  assertEquals(result.clientIP, null);
});
