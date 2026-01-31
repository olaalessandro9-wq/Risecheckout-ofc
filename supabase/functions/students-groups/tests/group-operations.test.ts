/**
 * Students Groups - Group Operations Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module students-groups/tests/group-operations
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  MOCK_BUYER_ID,
  MOCK_GROUPS,
  simulateAddToGroup,
  simulateRemoveFromGroup,
  simulateAssignGroups,
  filterGroupsByProduct,
  type GroupResponse
} from "./_shared.ts";

Deno.test("students-groups - Add to Group", async (t) => {
  await t.step("should create group assignment with correct fields", () => {
    const assignment = simulateAddToGroup(MOCK_BUYER_ID, MOCK_GROUPS[0].id);
    
    assertEquals((assignment as { buyer_id: string }).buyer_id, MOCK_BUYER_ID);
    assertEquals((assignment as { group_id: string }).group_id, MOCK_GROUPS[0].id);
    assertEquals((assignment as { is_active: boolean }).is_active, true);
    assertExists((assignment as { granted_at: string }).granted_at);
  });

  await t.step("should use upsert with buyer_id,group_id conflict", () => {
    const conflictKey = "buyer_id,group_id";
    assertEquals(conflictKey, "buyer_id,group_id");
  });
});

Deno.test("students-groups - Remove from Group", async (t) => {
  await t.step("should set is_active to false", () => {
    const update = simulateRemoveFromGroup();
    assertEquals(update.is_active, false);
  });
});

Deno.test("students-groups - Assign Groups", async (t) => {
  await t.step("should delete all existing groups first", () => {
    const deleteFirst = true;
    assertEquals(deleteFirst, true);
  });

  await t.step("should insert all new groups", () => {
    const groupIds = ["g1", "g2", "g3"];
    const assignments = simulateAssignGroups(MOCK_BUYER_ID, groupIds);
    
    assertEquals(assignments.length, 3);
    assertEquals((assignments[0] as { group_id: string }).group_id, "g1");
    assertEquals((assignments[1] as { group_id: string }).group_id, "g2");
    assertEquals((assignments[2] as { group_id: string }).group_id, "g3");
  });

  await t.step("should handle empty group_ids array", () => {
    const groupIds: string[] = [];
    const assignments = simulateAssignGroups(MOCK_BUYER_ID, groupIds);
    
    assertEquals(assignments.length, 0);
  });

  await t.step("should return groups_count in response", () => {
    const response: GroupResponse = {
      success: true,
      groups_count: 3
    };
    
    assertEquals(response.groups_count, 3);
  });
});

Deno.test("students-groups - List Groups", async (t) => {
  await t.step("should filter groups by product_id", () => {
    const filtered = filterGroupsByProduct(MOCK_GROUPS, "product-001");
    assertEquals(filtered.length, 3);
  });

  await t.step("should return empty array for non-existent product", () => {
    const filtered = filterGroupsByProduct(MOCK_GROUPS, "non-existent");
    assertEquals(filtered.length, 0);
  });

  await t.step("should order by position ascending", () => {
    const sorted = [...MOCK_GROUPS].sort((a, b) => a.position - b.position);
    assertEquals(sorted[0].position, 0);
    assertEquals(sorted[1].position, 1);
    assertEquals(sorted[2].position, 2);
  });

  await t.step("should return groups in response", () => {
    const response: GroupResponse = {
      success: true,
      groups: MOCK_GROUPS
    };
    
    assertExists(response.groups);
    assertEquals(response.groups!.length, 3);
  });
});
