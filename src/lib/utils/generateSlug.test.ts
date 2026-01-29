/**
 * Unit Tests: generateSlug
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for unique slug generation utility.
 * 
 * @module lib/utils/generateSlug.test
 */

import { describe, it, expect } from "vitest";
import { generateUniqueSlug } from "./generateSlug";

// ============================================================================
// Format Validation
// ============================================================================

describe("generateUniqueSlug - Format", () => {
  it("should return a string", () => {
    const slug = generateUniqueSlug();
    
    expect(typeof slug).toBe("string");
  });

  it("should have exactly 14 characters (7 + 1 + 6)", () => {
    const slug = generateUniqueSlug();
    
    expect(slug.length).toBe(14);
  });

  it("should match format: 7 chars + underscore + 6 digits", () => {
    const slug = generateUniqueSlug();
    
    // Format: abc123d_456789
    expect(slug).toMatch(/^[a-z0-9]{7}_[0-9]{6}$/);
  });

  it("should have underscore at position 7", () => {
    const slug = generateUniqueSlug();
    
    expect(slug[7]).toBe("_");
  });

  it("should have first part with 7 alphanumeric characters", () => {
    const slug = generateUniqueSlug();
    const firstPart = slug.split("_")[0];
    
    expect(firstPart.length).toBe(7);
    expect(firstPart).toMatch(/^[a-z0-9]+$/);
  });

  it("should have second part with exactly 6 digits", () => {
    const slug = generateUniqueSlug();
    const secondPart = slug.split("_")[1];
    
    expect(secondPart.length).toBe(6);
    expect(secondPart).toMatch(/^[0-9]+$/);
  });
});

// ============================================================================
// Character Set Validation
// ============================================================================

describe("generateUniqueSlug - Character Set", () => {
  it("should only use lowercase letters and numbers in first part", () => {
    const slugs = Array.from({ length: 100 }, () => generateUniqueSlug());
    
    slugs.forEach((slug) => {
      const firstPart = slug.split("_")[0];
      expect(firstPart).toMatch(/^[a-z0-9]+$/);
    });
  });

  it("should not contain uppercase letters", () => {
    const slugs = Array.from({ length: 100 }, () => generateUniqueSlug());
    
    slugs.forEach((slug) => {
      expect(slug).not.toMatch(/[A-Z]/);
    });
  });

  it("should not contain special characters except underscore", () => {
    const slugs = Array.from({ length: 100 }, () => generateUniqueSlug());
    
    slugs.forEach((slug) => {
      // Remove the expected underscore and check for others
      const withoutUnderscore = slug.replace(/_/g, "");
      expect(withoutUnderscore).toMatch(/^[a-z0-9]+$/);
    });
  });
});

// ============================================================================
// Numeric Part Validation
// ============================================================================

describe("generateUniqueSlug - Numeric Part", () => {
  it("should have numeric part between 100000 and 999999", () => {
    const slugs = Array.from({ length: 100 }, () => generateUniqueSlug());
    
    slugs.forEach((slug) => {
      const numericPart = parseInt(slug.split("_")[1], 10);
      expect(numericPart).toBeGreaterThanOrEqual(100000);
      expect(numericPart).toBeLessThanOrEqual(999999);
    });
  });

  it("should always produce 6-digit numbers (no leading zeros lost)", () => {
    const slugs = Array.from({ length: 100 }, () => generateUniqueSlug());
    
    slugs.forEach((slug) => {
      const secondPart = slug.split("_")[1];
      expect(secondPart[0]).not.toBe("0"); // First digit is never 0
    });
  });
});

// ============================================================================
// Uniqueness
// ============================================================================

describe("generateUniqueSlug - Uniqueness", () => {
  it("should generate unique slugs on multiple calls", () => {
    const slugs = Array.from({ length: 1000 }, () => generateUniqueSlug());
    const uniqueSlugs = new Set(slugs);
    
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it("should have variation in first part", () => {
    const slugs = Array.from({ length: 100 }, () => generateUniqueSlug());
    const firstParts = slugs.map((s) => s.split("_")[0]);
    const uniqueFirstParts = new Set(firstParts);
    
    // Should have many unique first parts
    expect(uniqueFirstParts.size).toBeGreaterThan(90);
  });

  it("should have variation in second part", () => {
    const slugs = Array.from({ length: 100 }, () => generateUniqueSlug());
    const secondParts = slugs.map((s) => s.split("_")[1]);
    const uniqueSecondParts = new Set(secondParts);
    
    // Should have many unique second parts
    expect(uniqueSecondParts.size).toBeGreaterThan(90);
  });
});

// ============================================================================
// URL Safety
// ============================================================================

describe("generateUniqueSlug - URL Safety", () => {
  it("should be URL-safe", () => {
    const slug = generateUniqueSlug();
    
    // Encode and compare - should be the same if URL-safe
    const encoded = encodeURIComponent(slug);
    expect(encoded).toBe(slug);
  });

  it("should be valid for use in URLs without encoding", () => {
    const slugs = Array.from({ length: 100 }, () => generateUniqueSlug());
    
    slugs.forEach((slug) => {
      // Valid URL path characters
      expect(slug).toMatch(/^[a-z0-9_]+$/);
    });
  });
});

// ============================================================================
// Performance
// ============================================================================

describe("generateUniqueSlug - Performance", () => {
  it("should generate slugs quickly", () => {
    const start = performance.now();
    
    for (let i = 0; i < 10000; i++) {
      generateUniqueSlug();
    }
    
    const duration = performance.now() - start;
    
    // Should generate 10,000 slugs in less than 100ms
    expect(duration).toBeLessThan(100);
  });
});
