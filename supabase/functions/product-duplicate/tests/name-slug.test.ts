/**
 * Product Duplicate - Name & Slug Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module product-duplicate/tests/name-slug
 */

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildDuplicateName, generateSlug, isValidSlugFormat } from "./_shared.ts";

Deno.test("product-duplicate - Name Generation", async (t) => {
  await t.step("deve adicionar sufixo (Cópia) ao nome", () => {
    const newName = buildDuplicateName("Meu Produto");
    assertEquals(newName, "Meu Produto (Cópia)");
  });

  await t.step("deve truncar nomes longos para respeitar limite de 100 caracteres", () => {
    const longName = "A".repeat(95);
    const newName = buildDuplicateName(longName);
    assertEquals(newName.length <= 100, true);
    assertStringIncludes(newName, "(Cópia)");
  });

  await t.step("deve preservar nome curto integralmente", () => {
    const shortName = "Curso";
    const newName = buildDuplicateName(shortName);
    assertEquals(newName, "Curso (Cópia)");
  });

  await t.step("deve adicionar ... quando nome é truncado", () => {
    const longName = "X".repeat(100);
    const newName = buildDuplicateName(longName);
    assertStringIncludes(newName, "...");
    assertStringIncludes(newName, "(Cópia)");
  });

  await t.step("nome no limite (92 caracteres + sufixo = 100)", () => {
    const name92 = "A".repeat(92);
    const newName = buildDuplicateName(name92);
    assertEquals(newName.length, 100);
  });
});

Deno.test("product-duplicate - Slug Generation", async (t) => {
  await t.step("deve gerar slug no formato xxxxxxx_xxxxxx", () => {
    const slug = generateSlug();
    assertEquals(isValidSlugFormat(slug), true);
  });

  await t.step("deve gerar slugs únicos", () => {
    const slugs = new Set<string>();
    for (let i = 0; i < 100; i++) {
      slugs.add(generateSlug());
    }
    assertEquals(slugs.size, 100);
  });

  await t.step("slug deve ter 14 caracteres (7 + 1 + 6)", () => {
    const slug = generateSlug();
    assertEquals(slug.length, 14);
  });

  await t.step("slug deve conter apenas letras minúsculas e números", () => {
    const slug = generateSlug();
    assertEquals(/^[a-z0-9_]+$/.test(slug), true);
  });
});
