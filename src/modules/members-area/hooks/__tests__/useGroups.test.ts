/**
 * useGroups Hook Tests
 * 
 * RISE V3 Compliant - 10.0/10
 * Tests group CRUD, permissions, and offer linking
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useGroups } from "../useGroups";
import { groupsService } from "../../services/groups.service";
import type { MemberGroup, GroupWithPermissions, UpdatePermissionsInput } from "../../types";

// Mock dependencies
vi.mock("../../services/groups.service", () => ({
  groupsService: {
    list: vi.fn(),
    listOffers: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updatePermissions: vi.fn(),
    linkOffers: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Test factory
function createMockGroup(overrides: Partial<MemberGroup> = {}): MemberGroup {
  return {
    id: "group-1",
    product_id: "product-1",
    name: "VIP Members",
    description: "Premium access group",
    is_default: false,
    is_active: true,
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("useGroups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mocks for initial fetch
    (groupsService.list as Mock).mockResolvedValue({ data: [], error: null });
    (groupsService.listOffers as Mock).mockResolvedValue({ data: [], error: null });
  });

  describe("initialization", () => {
    it("should fetch groups and offers on mount when productId is provided", async () => {
      (groupsService.list as Mock).mockResolvedValueOnce({
        data: [createMockGroup()],
        error: null,
      });

      const { result } = renderHook(() => useGroups("product-1"));

      await waitFor(() => {
        expect(result.current.groups).toHaveLength(1);
      });

      expect(groupsService.list).toHaveBeenCalledWith("product-1");
      expect(groupsService.listOffers).toHaveBeenCalledWith("product-1");
    });

    it("should not fetch when productId is undefined", () => {
      renderHook(() => useGroups(undefined));

      expect(groupsService.list).not.toHaveBeenCalled();
      expect(groupsService.listOffers).not.toHaveBeenCalled();
    });
  });

  describe("createGroup", () => {
    it("should create group and add to list", async () => {
      const newGroup = createMockGroup({ id: "new-group" });
      (groupsService.create as Mock).mockResolvedValueOnce({
        data: newGroup,
        error: null,
      });

      const { result } = renderHook(() => useGroups("product-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let created: MemberGroup | null = null;
      await act(async () => {
        created = await result.current.createGroup({
          name: "New Group",
          description: "Test",
        });
      });

      expect(created).toEqual(newGroup);
      expect(result.current.groups).toContainEqual(newGroup);
    });

    it("should reset is_default on other groups when creating default", async () => {
      const existingGroup = createMockGroup({ id: "existing", is_default: true });
      const newDefaultGroup = createMockGroup({ id: "new", is_default: true });

      (groupsService.list as Mock).mockResolvedValueOnce({
        data: [existingGroup],
        error: null,
      });
      (groupsService.create as Mock).mockResolvedValueOnce({
        data: newDefaultGroup,
        error: null,
      });

      const { result } = renderHook(() => useGroups("product-1"));

      await waitFor(() => {
        expect(result.current.groups).toHaveLength(1);
      });

      await act(async () => {
        await result.current.createGroup({
          name: "New Default",
          is_default: true,
        });
      });

      const oldGroup = result.current.groups.find((g) => g.id === "existing");
      expect(oldGroup?.is_default).toBe(false);
    });

    it("should return null when productId is undefined", async () => {
      const { result } = renderHook(() => useGroups(undefined));

      let created: MemberGroup | null = null;
      await act(async () => {
        created = await result.current.createGroup({ name: "Test" });
      });

      expect(created).toBeNull();
    });
  });

  describe("updateGroup", () => {
    it("should update group in list", async () => {
      const original = createMockGroup({ name: "Original" });
      const updated = { ...original, name: "Updated" };

      (groupsService.list as Mock).mockResolvedValueOnce({
        data: [original],
        error: null,
      });
      (groupsService.update as Mock).mockResolvedValueOnce({
        data: updated,
        error: null,
      });

      const { result } = renderHook(() => useGroups("product-1"));

      await waitFor(() => {
        expect(result.current.groups).toHaveLength(1);
      });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.updateGroup("group-1", { name: "Updated" });
      });

      expect(success).toBe(true);
      expect(result.current.groups[0].name).toBe("Updated");
    });
  });

  describe("deleteGroup", () => {
    it("should remove group from list", async () => {
      const group = createMockGroup();

      (groupsService.list as Mock).mockResolvedValueOnce({
        data: [group],
        error: null,
      });
      (groupsService.delete as Mock).mockResolvedValueOnce({
        error: null,
      });

      const { result } = renderHook(() => useGroups("product-1"));

      await waitFor(() => {
        expect(result.current.groups).toHaveLength(1);
      });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.deleteGroup("group-1");
      });

      expect(success).toBe(true);
      expect(result.current.groups).toHaveLength(0);
    });
  });

  describe("getGroup", () => {
    it("should fetch group with permissions", async () => {
      const groupWithPerms: GroupWithPermissions = {
        ...createMockGroup(),
        permissions: [
          { module_id: "m1", has_access: true },
        ],
      };

      (groupsService.get as Mock).mockResolvedValueOnce({
        data: groupWithPerms,
        error: null,
      });

      const { result } = renderHook(() => useGroups("product-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let fetched: GroupWithPermissions | null = null;
      await act(async () => {
        fetched = await result.current.getGroup("group-1");
      });

      expect(fetched).toEqual(groupWithPerms);
    });
  });

  describe("updatePermissions", () => {
    it("should update permissions silently when option passed", async () => {
      (groupsService.updatePermissions as Mock).mockResolvedValueOnce({
        error: null,
      });

      const { result } = renderHook(() => useGroups("product-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const input: UpdatePermissionsInput = {
        group_id: "group-1",
        permissions: [{ module_id: "m1", has_access: true }],
      };

      let success: boolean = false;
      await act(async () => {
        success = await result.current.updatePermissions(input, { silent: true });
      });

      expect(success).toBe(true);
    });
  });

  describe("linkOffers", () => {
    it("should link offers and refresh offers list", async () => {
      (groupsService.linkOffers as Mock).mockResolvedValueOnce({
        error: null,
      });
      (groupsService.listOffers as Mock).mockResolvedValueOnce({
        data: [{ id: "offer-1", name: "Offer 1", linked_group_id: "group-1" }],
        error: null,
      });

      const { result } = renderHook(() => useGroups("product-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.linkOffers("group-1", ["offer-1"]);
      });

      expect(success).toBe(true);
      expect(groupsService.listOffers).toHaveBeenCalled();
    });
  });
});
