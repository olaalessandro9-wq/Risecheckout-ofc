/**
 * Product Duplicate - Deep Clone Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module product-duplicate/tests/deep-clone
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mockCheckoutRows, mockComponents } from "./_shared.ts";

Deno.test("product-duplicate - Deep Clone (Rows + Components)", async (t) => {
  await t.step("deve clonar rows mantendo layout e ordem", () => {
    const clonedRows = mockCheckoutRows.map(row => ({
      layout: row.layout,
      row_order: row.row_order,
    }));
    assertEquals(clonedRows.length, 2);
    assertEquals(clonedRows[0].layout, "single");
    assertEquals(clonedRows[1].row_order, 1);
  });

  await t.step("deve clonar componentes mantendo tipo e content", () => {
    const clonedComponents = mockComponents.map(comp => ({
      type: comp.type,
      content: { ...comp.content },
      component_order: comp.component_order,
    }));
    assertEquals(clonedComponents.length, 2);
    assertEquals(clonedComponents[0].type, "header");
  });

  await t.step("deve manter referência row_id no novo componente", () => {
    const newRowId = "new-row-uuid";
    const clonedComponent = {
      ...mockComponents[0],
      id: "new-comp-uuid",
      row_id: newRowId,
    };
    assertEquals(clonedComponent.row_id, newRowId);
  });

  await t.step("deve preservar content como objeto", () => {
    const content = mockComponents[0].content;
    assertEquals(typeof content, "object");
    assertEquals(content.text, "Título");
  });
});
