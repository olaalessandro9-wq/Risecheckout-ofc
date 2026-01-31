/**
 * Permission Filters Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for permission-based navigation filtering including:
 * - Item visibility based on permissions
 * - Recursive group filtering
 * - Empty group removal
 * - Permission extraction
 */

import { describe, it, expect } from "vitest";
import {
  filterByPermissions,
  extractNavigationPermissions,
  type NavigationPermissions,
} from "../permissionFilters";
import type { NavItemConfig } from "../../types/navigation.types";
import type { Permissions } from "@/hooks/usePermissions";
import { Package, Settings2 } from "lucide-react";

// ============================================
// FIXTURES
// ============================================

const createRouteItem = (
  id: string,
  path: string,
  permissions?: NavItemConfig["permissions"]
): NavItemConfig => ({
  id,
  label: `Item ${id}`,
  icon: Package,
  variant: { type: "route", path },
  permissions,
});

const createGroupItem = (
  id: string,
  children: NavItemConfig[],
  permissions?: NavItemConfig["permissions"]
): NavItemConfig => ({
  id,
  label: `Group ${id}`,
  icon: Settings2,
  variant: { type: "group", children },
  permissions,
});

const ownerPermissions: NavigationPermissions = {
  role: "owner",
  canHaveAffiliates: true,
  canAccessAdminPanel: true,
};

const adminPermissions: NavigationPermissions = {
  role: "admin",
  canHaveAffiliates: false,
  canAccessAdminPanel: true,
};

const sellerPermissions: NavigationPermissions = {
  role: "seller",
  canHaveAffiliates: false,
  canAccessAdminPanel: false,
};

const userPermissions: NavigationPermissions = {
  role: "user",
  canHaveAffiliates: false,
  canAccessAdminPanel: false,
};

// ============================================
// TESTS
// ============================================

describe("permissionFilters", () => {
  describe("filterByPermissions()", () => {
    it("should show all items without permission restrictions", () => {
      const items = [
        createRouteItem("dashboard", "/dashboard"),
        createRouteItem("products", "/dashboard/produtos"),
      ];
      const filtered = filterByPermissions(items, userPermissions);
      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe("dashboard");
      expect(filtered[1].id).toBe("products");
    });

    it("should filter items requiring admin", () => {
      const items = [
        createRouteItem("dashboard", "/dashboard"),
        createRouteItem("admin", "/dashboard/admin", { requiresAdmin: true }),
      ];
      const userFiltered = filterByPermissions(items, userPermissions);
      expect(userFiltered).toHaveLength(1);
      expect(userFiltered[0].id).toBe("dashboard");
      const adminFiltered = filterByPermissions(items, adminPermissions);
      expect(adminFiltered).toHaveLength(2);
    });

    it("should filter items requiring owner (true)", () => {
      const items = [
        createRouteItem("dashboard", "/dashboard"),
        createRouteItem("gateways", "/dashboard/gateways", { requiresOwner: true }),
      ];
      const sellerFiltered = filterByPermissions(items, sellerPermissions);
      expect(sellerFiltered).toHaveLength(1);
      expect(sellerFiltered[0].id).toBe("dashboard");
      const ownerFiltered = filterByPermissions(items, ownerPermissions);
      expect(ownerFiltered).toHaveLength(2);
    });

    it("should filter items requiring non-owner (false)", () => {
      const items = [
        createRouteItem("dashboard", "/dashboard"),
        createRouteItem("financial", "/dashboard/financeiro", { requiresOwner: false }),
      ];
      const ownerFiltered = filterByPermissions(items, ownerPermissions);
      expect(ownerFiltered).toHaveLength(1);
      expect(ownerFiltered[0].id).toBe("dashboard");
      const sellerFiltered = filterByPermissions(items, sellerPermissions);
      expect(sellerFiltered).toHaveLength(2);
    });

    it("should filter items requiring canHaveAffiliates permission", () => {
      const items = [
        createRouteItem("dashboard", "/dashboard"),
        createRouteItem("affiliates", "/dashboard/afiliados", { requiresPermission: "canHaveAffiliates" }),
      ];
      const userFiltered = filterByPermissions(items, userPermissions);
      expect(userFiltered).toHaveLength(1);
      const ownerFiltered = filterByPermissions(items, ownerPermissions);
      expect(ownerFiltered).toHaveLength(2);
    });

    it("should filter items requiring canAccessAdminPanel permission", () => {
      const items = [
        createRouteItem("dashboard", "/dashboard"),
        createRouteItem("admin", "/dashboard/admin", { requiresPermission: "canAccessAdminPanel" }),
      ];
      const userFiltered = filterByPermissions(items, userPermissions);
      expect(userFiltered).toHaveLength(1);
      const adminFiltered = filterByPermissions(items, adminPermissions);
      expect(adminFiltered).toHaveLength(2);
    });

    it("should recursively filter group children", () => {
      const items = [
        createGroupItem("settings", [
          createRouteItem("pixels", "/dashboard/pixels"),
          createRouteItem("admin-only", "/dashboard/admin-settings", { requiresAdmin: true }),
        ]),
      ];
      const userFiltered = filterByPermissions(items, userPermissions);
      expect(userFiltered).toHaveLength(1);
      expect(userFiltered[0].variant.type).toBe("group");
      if (userFiltered[0].variant.type === "group") {
        expect(userFiltered[0].variant.children).toHaveLength(1);
        expect(userFiltered[0].variant.children[0].id).toBe("pixels");
      }
      const adminFiltered = filterByPermissions(items, adminPermissions);
      expect(adminFiltered).toHaveLength(1);
      if (adminFiltered[0].variant.type === "group") {
        expect(adminFiltered[0].variant.children).toHaveLength(2);
      }
    });

    it("should remove groups with no visible children", () => {
      const items = [
        createRouteItem("dashboard", "/dashboard"),
        createGroupItem("admin-group", [
          createRouteItem("admin1", "/dashboard/admin1", { requiresAdmin: true }),
          createRouteItem("admin2", "/dashboard/admin2", { requiresAdmin: true }),
        ]),
      ];
      const userFiltered = filterByPermissions(items, userPermissions);
      expect(userFiltered).toHaveLength(1);
      expect(userFiltered[0].id).toBe("dashboard");
    });

    it("should filter group itself based on permissions", () => {
      const items = [
        createRouteItem("dashboard", "/dashboard"),
        createGroupItem("admin-group", [createRouteItem("item", "/dashboard/item")], { requiresAdmin: true }),
      ];
      const userFiltered = filterByPermissions(items, userPermissions);
      expect(userFiltered).toHaveLength(1);
      expect(userFiltered[0].id).toBe("dashboard");
      const adminFiltered = filterByPermissions(items, adminPermissions);
      expect(adminFiltered).toHaveLength(2);
    });

    it("should handle complex nested permissions", () => {
      const items = [
        createRouteItem("dashboard", "/dashboard"),
        createRouteItem("owner-only", "/dashboard/gateways", { requiresOwner: true }),
        createGroupItem("settings", [
          createRouteItem("public", "/dashboard/public"),
          createRouteItem("admin-only", "/dashboard/admin", { requiresAdmin: true }),
        ]),
      ];
      const userFiltered = filterByPermissions(items, userPermissions);
      expect(userFiltered).toHaveLength(2);
      expect(userFiltered[0].id).toBe("dashboard");
      expect(userFiltered[1].id).toBe("settings");
      if (userFiltered[1].variant.type === "group") {
        expect(userFiltered[1].variant.children).toHaveLength(1);
        expect(userFiltered[1].variant.children[0].id).toBe("public");
      }
      const ownerFiltered = filterByPermissions(items, ownerPermissions);
      expect(ownerFiltered).toHaveLength(3);
      if (ownerFiltered[2].variant.type === "group") {
        expect(ownerFiltered[2].variant.children).toHaveLength(2);
      }
    });
  });

  describe("extractNavigationPermissions()", () => {
    it("should extract correct subset of permissions", () => {
      const fullPermissions: Permissions = {
        role: "owner",
        canHaveAffiliates: true,
        canAccessAdminPanel: true,
        canManageProducts: true,
        canAccessMarketplace: true,
        canBecomeAffiliate: true,
        canViewSecurityLogs: true,
        canManageUsers: true,
        isLoading: false,
        error: null,
      };
      const navPermissions = extractNavigationPermissions(fullPermissions);
      expect(navPermissions).toEqual({
        role: "owner",
        canHaveAffiliates: true,
        canAccessAdminPanel: true,
      });
    });

    it("should work with minimal permissions", () => {
      const fullPermissions: Permissions = {
        role: "user",
        canHaveAffiliates: false,
        canAccessAdminPanel: false,
        canManageProducts: false,
        canAccessMarketplace: true,
        canBecomeAffiliate: true,
        canViewSecurityLogs: false,
        canManageUsers: false,
        isLoading: false,
        error: null,
      };
      const navPermissions = extractNavigationPermissions(fullPermissions);
      expect(navPermissions).toEqual({
        role: "user",
        canHaveAffiliates: false,
        canAccessAdminPanel: false,
      });
    });
  });
});
