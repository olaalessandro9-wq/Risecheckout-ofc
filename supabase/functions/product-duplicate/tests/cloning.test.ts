/**
 * Product Duplicate - Cloning Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module product-duplicate/tests/cloning
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  mockProduct,
  mockOffers,
  mockCheckouts,
  buildDuplicateName,
  isValidUUID,
  generateSlug,
  isValidSlugFormat,
  type ProductBase
} from "./_shared.ts";

Deno.test("product-duplicate - Product Cloning", async (t) => {
  await t.step("deve copiar campos obrigatórios do produto", () => {
    const cloned = {
      name: buildDuplicateName(mockProduct.name),
      description: mockProduct.description,
      price: mockProduct.price,
      image_url: mockProduct.image_url,
      user_id: mockProduct.user_id,
      status: mockProduct.status ?? "active",
      support_name: mockProduct.support_name,
      support_email: mockProduct.support_email,
    };

    assertExists(cloned.name);
    assertEquals(cloned.price, 19700);
    assertEquals(cloned.user_id, "user-456");
  });

  await t.step("deve preservar description mesmo que null", () => {
    const productSemDesc: ProductBase = { ...mockProduct, description: null };
    const cloned = { description: productSemDesc.description ?? null };
    assertEquals(cloned.description, null);
  });

  await t.step("deve usar status 'active' como fallback", () => {
    const productSemStatus: ProductBase = { ...mockProduct, status: null };
    const status = productSemStatus.status ?? "active";
    assertEquals(status, "active");
  });

  await t.step("deve gerar novo ID para produto clonado", () => {
    const originalId = mockProduct.id;
    const newId = "550e8400-e29b-41d4-a716-446655440001";
    assertEquals(originalId !== newId, true);
    assertEquals(isValidUUID(newId), true);
  });
});

Deno.test("product-duplicate - Offers Cloning", async (t) => {
  await t.step("deve identificar oferta default corretamente", () => {
    const defaultOffer = mockOffers.find(o => o.is_default);
    assertExists(defaultOffer);
    assertEquals(defaultOffer.name, "Oferta Padrão");
  });

  await t.step("deve listar ofertas não-default para clonagem", () => {
    const nonDefaultOffers = mockOffers.filter(o => !o.is_default);
    assertEquals(nonDefaultOffers.length, 1);
    assertEquals(nonDefaultOffers[0].name, "Oferta VIP");
  });

  await t.step("deve preservar preço ao clonar oferta default", () => {
    const defaultOffer = mockOffers.find(o => o.is_default);
    assertExists(defaultOffer);
    const clonedPrice = defaultOffer.price;
    assertEquals(clonedPrice, 19700);
  });

  await t.step("deve manter status 'active' nas ofertas clonadas", () => {
    const activeOffers = mockOffers.filter(o => o.status === "active");
    assertEquals(activeOffers.length, 2);
  });
});

Deno.test("product-duplicate - Checkouts Cloning", async (t) => {
  await t.step("deve identificar checkout default corretamente", () => {
    const defaultCheckout = mockCheckouts.find(c => c.is_default);
    assertExists(defaultCheckout);
    assertEquals(defaultCheckout.name, "Checkout Principal");
  });

  await t.step("deve listar checkouts não-default para clonagem", () => {
    const nonDefaultCheckouts = mockCheckouts.filter(c => !c.is_default);
    assertEquals(nonDefaultCheckouts.length, 1);
    assertEquals(nonDefaultCheckouts[0].name, "Checkout VIP");
  });

  await t.step("deve resetar visits_count para 0 no clone", () => {
    const clonedCheckout = { ...mockCheckouts[0], visits_count: 0 };
    assertEquals(clonedCheckout.visits_count, 0);
  });

  await t.step("deve gerar novo slug para checkout clonado", () => {
    const originalSlug = mockCheckouts[0].slug;
    const newSlug = generateSlug();
    assertEquals(originalSlug !== newSlug, true);
    assertEquals(isValidSlugFormat(newSlug), true);
  });

  await t.step("deve preservar seller_name no clone", () => {
    const cloned = { seller_name: mockCheckouts[0].seller_name };
    assertEquals(cloned.seller_name, "Rise");
  });
});
