/**
 * Navigation Config Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for static navigation configuration including:
 * - Structure validation
 * - Unique IDs
 * - Valid paths and URLs
 * - Consistent permissions
 * - Proper group structure
 */

import { describe, it, expect } from "vitest";
import { NAVIGATION_CONFIG } from "../navigationConfig";
import type { NavItemConfig } from "../../types/navigation.types";

// ============================================
// HELPER FUNCTIONS
// ============================================

function getAllIds(items: readonly NavItemConfig[]): string[] {
  const ids: string[] = [];
  
  for (const item of items) {
    ids.push(item.id);
    
    if (item.variant.type === "group") {
      ids.push(...getAllIds(item.variant.children));
    }
  }
  
  return ids;
}

function getAllRoutePaths(items: readonly NavItemConfig[]): string[] {
  const paths: string[] = [];
  
  for (const item of items) {
    if (item.variant.type === "route") {
      paths.push(item.variant.path);
    } else if (item.variant.type === "group") {
      paths.push(...getAllRoutePaths(item.variant.children));
    }
  }
  
  return paths;
}

function getAllExternalUrls(items: readonly NavItemConfig[]): string[] {
  const urls: string[] = [];
  
  for (const item of items) {
    if (item.variant.type === "external") {
      urls.push(item.variant.url);
    } else if (item.variant.type === "group") {
      urls.push(...getAllExternalUrls(item.variant.children));
    }
  }
  
  return urls;
}

// ============================================
// TESTS
// ============================================

describe("navigationConfig", () => {
  describe("NAVIGATION_CONFIG", () => {
    it("should be a non-empty array", () => {
      expect(Array.isArray(NAVIGATION_CONFIG)).toBe(true);
      expect(NAVIGATION_CONFIG.length).toBeGreaterThan(0);
    });

    it("should have all items with required properties", () => {
      for (const item of NAVIGATION_CONFIG) {
        expect(item.id).toBeDefined();
        expect(typeof item.id).toBe("string");
        expect(item.id.length).toBeGreaterThan(0);
        
        expect(item.label).toBeDefined();
        expect(typeof item.label).toBe("string");
        expect(item.label.length).toBeGreaterThan(0);
        
        expect(item.icon).toBeDefined();
        // Icon can be either function or object (React component)
        expect(["function", "object"]).toContain(typeof item.icon);
        
        expect(item.variant).toBeDefined();
        expect(item.variant.type).toBeDefined();
      }
    });

    it("should have unique IDs across all items and nested children", () => {
      const allIds = getAllIds(NAVIGATION_CONFIG);
      const uniqueIds = new Set(allIds);
      
      expect(allIds.length).toBe(uniqueIds.size);
    });

    it("should have valid route paths starting with /", () => {
      const paths = getAllRoutePaths(NAVIGATION_CONFIG);
      
      for (const path of paths) {
        expect(path).toMatch(/^\//);
      }
    });

    it("should have valid external URLs starting with http", () => {
      const urls = getAllExternalUrls(NAVIGATION_CONFIG);
      
      for (const url of urls) {
        expect(url).toMatch(/^https?:\/\//);
      }
    });

    it("should have groups with non-empty children", () => {
      for (const item of NAVIGATION_CONFIG) {
        if (item.variant.type === "group") {
          expect(item.variant.children.length).toBeGreaterThan(0);
        }
      }
    });

    it("should have consistent permission structure", () => {
      function validatePermissions(item: NavItemConfig): void {
        if (item.permissions) {
          const { requiresAdmin, requiresOwner, requiresPermission } = item.permissions;
          
          // requiresAdmin should be boolean if present
          if (requiresAdmin !== undefined) {
            expect(typeof requiresAdmin).toBe("boolean");
          }
          
          // requiresOwner should be boolean if present
          if (requiresOwner !== undefined) {
            expect(typeof requiresOwner).toBe("boolean");
          }
          
          // requiresPermission should be valid string if present
          if (requiresPermission !== undefined) {
            expect(["canHaveAffiliates", "canAccessAdminPanel"]).toContain(
              requiresPermission
            );
          }
        }
        
        // Recursively validate children
        if (item.variant.type === "group") {
          for (const child of item.variant.children) {
            validatePermissions(child);
          }
        }
      }
      
      for (const item of NAVIGATION_CONFIG) {
        validatePermissions(item);
      }
    });

    it("should have dashboard as first item", () => {
      expect(NAVIGATION_CONFIG[0].id).toBe("dashboard");
      expect(NAVIGATION_CONFIG[0].variant.type).toBe("route");
      if (NAVIGATION_CONFIG[0].variant.type === "route") {
        expect(NAVIGATION_CONFIG[0].variant.path).toBe("/dashboard");
        expect(NAVIGATION_CONFIG[0].variant.exact).toBe(true);
      }
    });

    it("should have mutually exclusive owner permissions", () => {
      // Find items with requiresOwner: true and requiresOwner: false
      const ownerOnlyItems: string[] = [];
      const nonOwnerItems: string[] = [];
      
      function checkOwnerPermissions(item: NavItemConfig): void {
        if (item.permissions?.requiresOwner === true) {
          ownerOnlyItems.push(item.id);
        }
        if (item.permissions?.requiresOwner === false) {
          nonOwnerItems.push(item.id);
        }
        
        if (item.variant.type === "group") {
          for (const child of item.variant.children) {
            checkOwnerPermissions(child);
          }
        }
      }
      
      for (const item of NAVIGATION_CONFIG) {
        checkOwnerPermissions(item);
      }
      
      // Verify gateways (owner-only) and financial (non-owner) exist
      expect(ownerOnlyItems).toContain("gateways");
      expect(nonOwnerItems).toContain("financial");
      
      // Verify no overlap
      const overlap = ownerOnlyItems.filter(id => nonOwnerItems.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it("should have valid comingSoonForRoles when present", () => {
      for (const item of NAVIGATION_CONFIG) {
        if (item.comingSoonForRoles) {
          expect(Array.isArray(item.comingSoonForRoles)).toBe(true);
          
          for (const role of item.comingSoonForRoles) {
            expect(["owner", "admin", "seller", "user"]).toContain(role);
          }
        }
      }
    });
  });
});
