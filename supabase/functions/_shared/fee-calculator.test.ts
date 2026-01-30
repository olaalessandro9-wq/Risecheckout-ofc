/**
 * Fee Calculator Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the platform fee calculation module.
 * CRITICAL: These tests validate financial calculations that affect revenue.
 * 
 * @module _shared/fee-calculator.test
 */

import { assertEquals, assertAlmostEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  calculatePlatformFeeCents,
  calculatePlatformFeeReais,
  getPlatformFeePercentFormatted,
  calculateAffiliateCommission,
} from "./fee-calculator.ts";

// ============================================================================
// Constants for Testing
// ============================================================================

const DEFAULT_FEE = 0.04; // 4%

// ============================================================================
// calculatePlatformFeeCents Tests
// ============================================================================

Deno.test("calculatePlatformFeeCents: should calculate 4% of 10000 cents (R$ 100)", () => {
  const result = calculatePlatformFeeCents(10000);
  assertEquals(result, 400); // 4% of 10000 = 400 cents (R$ 4.00)
});

Deno.test("calculatePlatformFeeCents: should calculate 4% of 9990 cents (R$ 99.90)", () => {
  const result = calculatePlatformFeeCents(9990);
  assertEquals(result, 399); // 4% of 9990 = 399.6, floored to 399
});

Deno.test("calculatePlatformFeeCents: should calculate 4% of 1 cent", () => {
  const result = calculatePlatformFeeCents(1);
  assertEquals(result, 0); // 4% of 1 = 0.04, floored to 0
});

Deno.test("calculatePlatformFeeCents: should calculate 4% of 100 cents (R$ 1.00)", () => {
  const result = calculatePlatformFeeCents(100);
  assertEquals(result, 4); // 4% of 100 = 4 cents
});

Deno.test("calculatePlatformFeeCents: should return 0 for 0 cents", () => {
  const result = calculatePlatformFeeCents(0);
  assertEquals(result, 0);
});

Deno.test("calculatePlatformFeeCents: should use custom fee percent (10%)", () => {
  const result = calculatePlatformFeeCents(10000, 0.10);
  assertEquals(result, 1000); // 10% of 10000 = 1000 cents
});

Deno.test("calculatePlatformFeeCents: should use custom fee percent (2.5%)", () => {
  const result = calculatePlatformFeeCents(10000, 0.025);
  assertEquals(result, 250); // 2.5% of 10000 = 250 cents
});

Deno.test("calculatePlatformFeeCents: should handle large amounts (R$ 100.000)", () => {
  const result = calculatePlatformFeeCents(10000000);
  assertEquals(result, 400000); // 4% of R$ 100.000 = R$ 4.000
});

Deno.test("calculatePlatformFeeCents: should floor fractional results", () => {
  // 4% of 123 = 4.92, should floor to 4
  const result = calculatePlatformFeeCents(123);
  assertEquals(result, 4);
});

// ============================================================================
// calculatePlatformFeeReais Tests
// ============================================================================

Deno.test("calculatePlatformFeeReais: should calculate 4% of R$ 100", () => {
  const result = calculatePlatformFeeReais(100);
  assertAlmostEquals(result, 4, 0.001);
});

Deno.test("calculatePlatformFeeReais: should calculate 4% of R$ 99.90", () => {
  const result = calculatePlatformFeeReais(99.90);
  assertAlmostEquals(result, 3.996, 0.001);
});

Deno.test("calculatePlatformFeeReais: should return 0 for R$ 0", () => {
  const result = calculatePlatformFeeReais(0);
  assertEquals(result, 0);
});

Deno.test("calculatePlatformFeeReais: should use custom fee percent (10%)", () => {
  const result = calculatePlatformFeeReais(100, 0.10);
  assertAlmostEquals(result, 10, 0.001);
});

Deno.test("calculatePlatformFeeReais: should handle large amounts (R$ 100.000)", () => {
  const result = calculatePlatformFeeReais(100000);
  assertAlmostEquals(result, 4000, 0.001);
});

// ============================================================================
// getPlatformFeePercentFormatted Tests
// ============================================================================

Deno.test("getPlatformFeePercentFormatted: should return '4%' for default fee", () => {
  const result = getPlatformFeePercentFormatted();
  assertEquals(result, "4%");
});

Deno.test("getPlatformFeePercentFormatted: should return '10%' for 0.10", () => {
  const result = getPlatformFeePercentFormatted(0.10);
  assertEquals(result, "10%");
});

Deno.test("getPlatformFeePercentFormatted: should return '2.5%' for 0.025", () => {
  const result = getPlatformFeePercentFormatted(0.025);
  assertEquals(result, "2.5%");
});

Deno.test("getPlatformFeePercentFormatted: should return '0%' for 0", () => {
  const result = getPlatformFeePercentFormatted(0);
  assertEquals(result, "0%");
});

// ============================================================================
// calculateAffiliateCommission Tests (Modelo Cakto)
// ============================================================================

Deno.test("calculateAffiliateCommission: should calculate correctly for 70% commission", () => {
  // Total: R$ 100.00 (10000 cents)
  // Platform fee (4%): R$ 4.00 (400 cents)
  // Net after fee: R$ 96.00 (9600 cents)
  // Affiliate commission (70% of net): R$ 67.20 (6720 cents)
  // Producer receives: R$ 28.80 (2880 cents)
  
  const result = calculateAffiliateCommission(10000, 70, DEFAULT_FEE);
  
  assertEquals(result.platformFeeCents, 400);
  assertEquals(result.netAfterFee, 9600);
  assertEquals(result.commissionCents, 6720);
  assertEquals(result.producerCents, 2880);
});

Deno.test("calculateAffiliateCommission: should calculate correctly for 50% commission", () => {
  // Total: R$ 100.00 (10000 cents)
  // Platform fee (4%): R$ 4.00 (400 cents)
  // Net after fee: R$ 96.00 (9600 cents)
  // Affiliate commission (50% of net): R$ 48.00 (4800 cents)
  // Producer receives: R$ 48.00 (4800 cents)
  
  const result = calculateAffiliateCommission(10000, 50, DEFAULT_FEE);
  
  assertEquals(result.platformFeeCents, 400);
  assertEquals(result.netAfterFee, 9600);
  assertEquals(result.commissionCents, 4800);
  assertEquals(result.producerCents, 4800);
});

Deno.test("calculateAffiliateCommission: should handle 0% commission (no affiliate)", () => {
  const result = calculateAffiliateCommission(10000, 0, DEFAULT_FEE);
  
  assertEquals(result.platformFeeCents, 400);
  assertEquals(result.netAfterFee, 9600);
  assertEquals(result.commissionCents, 0);
  assertEquals(result.producerCents, 9600);
});

Deno.test("calculateAffiliateCommission: should handle 100% commission", () => {
  const result = calculateAffiliateCommission(10000, 100, DEFAULT_FEE);
  
  assertEquals(result.platformFeeCents, 400);
  assertEquals(result.netAfterFee, 9600);
  assertEquals(result.commissionCents, 9600);
  assertEquals(result.producerCents, 0);
});

Deno.test("calculateAffiliateCommission: should floor fractional commission", () => {
  // Total: R$ 99.90 (9990 cents)
  // Platform fee (4%): 399.6 → 399 cents
  // Net after fee: 9990 - 399 = 9591 cents
  // Affiliate commission (70% of 9591): 6713.7 → 6713 cents
  // Producer receives: 9591 - 6713 = 2878 cents
  
  const result = calculateAffiliateCommission(9990, 70, DEFAULT_FEE);
  
  assertEquals(result.platformFeeCents, 399);
  assertEquals(result.netAfterFee, 9591);
  assertEquals(result.commissionCents, 6713);
  assertEquals(result.producerCents, 2878);
});

Deno.test("calculateAffiliateCommission: should use default platform fee", () => {
  // Without explicit platform fee, should use 4%
  const result = calculateAffiliateCommission(10000, 50);
  
  assertEquals(result.platformFeeCents, 400); // 4% of 10000
});

Deno.test("calculateAffiliateCommission: should work with custom platform fee (10%)", () => {
  const result = calculateAffiliateCommission(10000, 50, 0.10);
  
  assertEquals(result.platformFeeCents, 1000); // 10% of 10000
  assertEquals(result.netAfterFee, 9000);
  assertEquals(result.commissionCents, 4500); // 50% of 9000
  assertEquals(result.producerCents, 4500);
});

Deno.test("calculateAffiliateCommission: should handle small amounts (R$ 1.00)", () => {
  const result = calculateAffiliateCommission(100, 70, DEFAULT_FEE);
  
  assertEquals(result.platformFeeCents, 4); // 4% of 100
  assertEquals(result.netAfterFee, 96);
  assertEquals(result.commissionCents, 67); // 70% of 96 = 67.2 → 67
  assertEquals(result.producerCents, 29);
});

Deno.test("calculateAffiliateCommission: sum of parts should equal total minus platform fee", () => {
  const totalCents = 15750; // R$ 157.50
  const result = calculateAffiliateCommission(totalCents, 60, DEFAULT_FEE);
  
  // Verify: commissionCents + producerCents = netAfterFee
  assertEquals(result.commissionCents + result.producerCents, result.netAfterFee);
  
  // Verify: platformFeeCents + netAfterFee = totalCents
  assertEquals(result.platformFeeCents + result.netAfterFee, totalCents);
});

// ============================================================================
// Edge Cases
// ============================================================================

Deno.test("Edge Case: should handle very small amount (1 cent)", () => {
  const result = calculateAffiliateCommission(1, 70, DEFAULT_FEE);
  
  assertEquals(result.platformFeeCents, 0); // 4% of 1 = 0.04 → 0
  assertEquals(result.netAfterFee, 1);
  assertEquals(result.commissionCents, 0); // 70% of 1 = 0.7 → 0
  assertEquals(result.producerCents, 1);
});

Deno.test("Edge Case: should handle zero amount", () => {
  const result = calculateAffiliateCommission(0, 70, DEFAULT_FEE);
  
  assertEquals(result.platformFeeCents, 0);
  assertEquals(result.netAfterFee, 0);
  assertEquals(result.commissionCents, 0);
  assertEquals(result.producerCents, 0);
});

Deno.test("Edge Case: should handle very large amount (R$ 1.000.000)", () => {
  const totalCents = 100000000; // R$ 1.000.000
  const result = calculateAffiliateCommission(totalCents, 70, DEFAULT_FEE);
  
  assertEquals(result.platformFeeCents, 4000000); // R$ 40.000
  assertEquals(result.netAfterFee, 96000000);
  assertEquals(result.commissionCents, 67200000); // R$ 672.000
  assertEquals(result.producerCents, 28800000); // R$ 288.000
  
  // Verify consistency
  assertEquals(result.commissionCents + result.producerCents, result.netAfterFee);
});

Deno.test("Edge Case: should maintain precision with odd numbers", () => {
  // 4% of 9999 = 399.96 → 399
  // Net: 9999 - 399 = 9600
  // 70% of 9600 = 6720
  const result = calculateAffiliateCommission(9999, 70, DEFAULT_FEE);
  
  assertEquals(result.platformFeeCents, 399);
  assertEquals(result.netAfterFee, 9600);
  assertEquals(result.commissionCents, 6720);
  assertEquals(result.producerCents, 2880);
});

// ============================================================================
// EXPANDED TESTS - RISE V3 Phase 4
// ============================================================================

// Edge Cases: Negative Values
Deno.test("calculatePlatformFeeCents: should handle negative amount gracefully", () => {
  const result = calculatePlatformFeeCents(-1000);
  assertEquals(result, 0); // Should not return negative fees
});

Deno.test("calculatePlatformFeeReais: should handle negative amount gracefully", () => {
  const result = calculatePlatformFeeReais(-100);
  assertEquals(result, 0); // Should not return negative fees
});

// Edge Cases: Very Small Amounts
Deno.test("calculatePlatformFeeCents: should handle very small amounts (10 cents)", () => {
  const result = calculatePlatformFeeCents(10);
  assertEquals(result, 0); // 4% of 10 = 0.4, floored to 0
});

Deno.test("calculatePlatformFeeCents: should handle very small amounts (25 cents)", () => {
  const result = calculatePlatformFeeCents(25);
  assertEquals(result, 1); // 4% of 25 = 1
});

// Edge Cases: Extreme Fee Percentages
Deno.test("calculatePlatformFeeCents: should handle 0% fee", () => {
  const result = calculatePlatformFeeCents(10000, 0);
  assertEquals(result, 0);
});

Deno.test("calculatePlatformFeeCents: should handle 100% fee", () => {
  const result = calculatePlatformFeeCents(10000, 1.0);
  assertEquals(result, 10000);
});

Deno.test("calculatePlatformFeeReais: should handle 0% fee", () => {
  const result = calculatePlatformFeeReais(100, 0);
  assertEquals(result, 0);
});

Deno.test("calculatePlatformFeeReais: should handle 100% fee", () => {
  const result = calculatePlatformFeeReais(100, 1.0);
  assertAlmostEquals(result, 100, 0.001);
});

// Edge Cases: Precision and Rounding
Deno.test("calculatePlatformFeeCents: should maintain precision for 9997 cents", () => {
  const result = calculatePlatformFeeCents(9997);
  assertEquals(result, 399); // 4% of 9997 = 399.88, floored to 399
});

Deno.test("calculatePlatformFeeCents: should maintain precision for 12345 cents", () => {
  const result = calculatePlatformFeeCents(12345);
  assertEquals(result, 493); // 4% of 12345 = 493.8, floored to 493
});

// Affiliate Commission Tests
Deno.test("calculateAffiliateCommission: should calculate commission correctly", () => {
  const result = calculateAffiliateCommission(10000, 0.10);
  assertEquals(result, 1000); // 10% of 10000 = 1000 cents
});

Deno.test("calculateAffiliateCommission: should handle 0% commission", () => {
  const result = calculateAffiliateCommission(10000, 0);
  assertEquals(result, 0);
});

Deno.test("calculateAffiliateCommission: should handle 50% commission", () => {
  const result = calculateAffiliateCommission(10000, 0.50);
  assertEquals(result, 5000);
});

Deno.test("calculateAffiliateCommission: should floor fractional results", () => {
  const result = calculateAffiliateCommission(123, 0.15);
  assertEquals(result, 18); // 15% of 123 = 18.45, floored to 18
});

// Platform Fee Formatting Tests
Deno.test("getPlatformFeePercentFormatted: should return formatted percentage", () => {
  const result = getPlatformFeePercentFormatted();
  assertEquals(typeof result, 'string');
  assertEquals(result, '4%'); // Default 4%
});

Deno.test("getPlatformFeePercentFormatted: should format custom percentage", () => {
  const result = getPlatformFeePercentFormatted(0.10);
  assertEquals(result, '10%');
});

Deno.test("getPlatformFeePercentFormatted: should format decimal percentage", () => {
  const result = getPlatformFeePercentFormatted(0.025);
  assertEquals(result, '2.5%');
});

// Integration Tests: Real-world Scenarios
Deno.test("Real-world scenario: R$ 497 product with 4% platform fee", () => {
  const amountCents = 49700;
  const platformFee = calculatePlatformFeeCents(amountCents);
  assertEquals(platformFee, 1988); // R$ 19.88
});

Deno.test("Real-world scenario: R$ 1997 product with 10% affiliate commission", () => {
  const amountCents = 199700;
  const affiliateCommission = calculateAffiliateCommission(amountCents, 0.10);
  assertEquals(affiliateCommission, 19970); // R$ 199.70
});

Deno.test("Real-world scenario: R$ 97 product with 4% platform fee and 15% affiliate", () => {
  const amountCents = 9700;
  const platformFee = calculatePlatformFeeCents(amountCents);
  const affiliateCommission = calculateAffiliateCommission(amountCents, 0.15);
  
  assertEquals(platformFee, 388); // R$ 3.88
  assertEquals(affiliateCommission, 1455); // R$ 14.55
  
  // Vendor receives: 9700 - 388 - 1455 = 7857 (R$ 78.57)
  const vendorAmount = amountCents - platformFee - affiliateCommission;
  assertEquals(vendorAmount, 7857);
});
