/**
 * Product Duplicate Handlers
 * 
 * Extracted handlers for product-duplicate edge function.
 * 
 * RISE Protocol Compliant - Zero `any`
 */

// deno-lint-ignore no-explicit-any
type SupabaseClientAny = any;

import { ensureUniqueSlug, toSlug } from "./edge-helpers.ts";

// ============================================
// TYPES
// ============================================

export interface ProductBase {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  user_id: string;
  status: string | null;
  support_name: string | null;
  support_email: string | null;
}

export interface CheckoutRow {
  id: string;
  checkout_id: string;
  layout: string;
  row_order: number;
}

export interface CheckoutComponent {
  id: string;
  row_id: string;
  type: string;
  content: unknown;
  component_order: number;
}

export interface Checkout {
  id: string;
  product_id: string;
  name: string;
  slug: string | null;
  seller_name: string | null;
  is_default: boolean;
  status: string | null;
  visits_count: number;
}

export interface Offer {
  id: string;
  product_id: string;
  name: string;
  price: number;
  is_default: boolean;
  status: string;
}

export interface CheckoutLink {
  id: string;
  checkout_id: string;
  slug: string;
}

// ============================================
// OWNERSHIP VERIFICATION
// ============================================

export async function verifyProductOwnership(
  supabase: SupabaseClientAny,
  productId: string,
  producerId: string
): Promise<{ valid: boolean; product?: ProductBase }> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, price, image_url, user_id, status, support_name, support_email")
    .eq("id", productId)
    .eq("user_id", producerId)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  const product = data as ProductBase;
  return { valid: true, product };
}

// ============================================
// CLONE CHECKOUT LINKS
// ============================================

export async function cloneCheckoutLinks(
  supabase: SupabaseClientAny,
  srcCheckoutId: string,
  newCheckoutId: string,
  suggestedSlug: string
): Promise<void> {
  try {
    const { data: srcLinks } = await supabase
      .from("checkout_links")
      .select("*")
      .eq("checkout_id", srcCheckoutId);

    if (srcLinks?.length) {
      for (const link of srcLinks as CheckoutLink[]) {
        const newSlug = await ensureUniqueSlug(supabase, "checkout_links", "slug", suggestedSlug);
        const insert = {
          checkout_id: newCheckoutId,
          slug: newSlug,
        };
        await supabase.from("checkout_links").insert(insert);
      }
      return;
    }
  } catch (e) {
    console.log("[product-duplicate] No checkout_links found, trying payment_links");
  }

  try {
    const { data: payLinks } = await supabase
      .from("payment_links")
      .select("*")
      .eq("checkout_id", srcCheckoutId);

    if (payLinks?.length) {
      for (const link of payLinks as CheckoutLink[]) {
        const newSlug = await ensureUniqueSlug(supabase, "payment_links", "slug", suggestedSlug);
        const insert = {
          checkout_id: newCheckoutId,
          slug: newSlug,
        };
        await supabase.from("payment_links").insert(insert);
      }
    }
  } catch (e) {
    console.log("[product-duplicate] No payment_links found");
  }
}

// ============================================
// CLONE CHECKOUT DEEP (ROWS + COMPONENTS)
// ============================================

export async function cloneCheckoutDeep(
  supabase: SupabaseClientAny,
  srcCheckoutId: string,
  destCheckoutId: string
): Promise<void> {
  const { data: srcRows } = await supabase
    .from("checkout_rows")
    .select("*")
    .eq("checkout_id", srcCheckoutId)
    .order("row_order", { ascending: true });

  if (!srcRows?.length) return;

  for (const row of srcRows as CheckoutRow[]) {
    const { data: newRow, error: rowError } = await supabase
      .from("checkout_rows")
      .insert({
        checkout_id: destCheckoutId,
        layout: row.layout,
        row_order: row.row_order,
      })
      .select("id")
      .single();

    if (rowError || !newRow) {
      console.error("[product-duplicate] Failed to clone row:", rowError);
      continue;
    }

    const newRowData = newRow as { id: string };

    const { data: srcComponents } = await supabase
      .from("checkout_components")
      .select("*")
      .eq("row_id", row.id)
      .order("component_order", { ascending: true });

    if (srcComponents?.length) {
      for (const comp of srcComponents as CheckoutComponent[]) {
        await supabase.from("checkout_components").insert({
          row_id: newRowData.id,
          type: comp.type,
          content: comp.content,
          component_order: comp.component_order,
        });
      }
    }
  }
}

// ============================================
// DUPLICATE PRODUCT (MAIN LOGIC)
// ============================================

export async function duplicateProduct(
  supabase: SupabaseClientAny,
  productId: string,
  srcProduct: ProductBase,
  producerId: string,
  ensureUniqueName: (supabase: SupabaseClientAny, baseName: string) => Promise<string>
): Promise<{ success: boolean; newProductId?: string; error?: string }> {
  try {
    const baseName = `${srcProduct.name} (Cópia)`;
    const newName = await ensureUniqueName(supabase, baseName);

    const { data: newProduct, error: insertError } = await supabase
      .from("products")
      .insert({
        name: newName,
        description: srcProduct.description ?? null,
        price: srcProduct.price,
        image_url: srcProduct.image_url ?? null,
        user_id: producerId,
        status: srcProduct.status ?? "active",
        support_name: srcProduct.support_name ?? null,
        support_email: srcProduct.support_email ?? null,
      })
      .select("id, name")
      .single();

    if (insertError || !newProduct) {
      throw new Error(`Falha ao criar produto: ${insertError?.message}`);
    }

    const newProductData = newProduct as { id: string; name: string };
    const newProductId = newProductData.id;

    // Wait for trigger-created checkout and offer
    let autoCheckout: Checkout | null = null;
    let autoOffer: Offer | null = null;

    for (let i = 0; i < 10 && (!autoCheckout || !autoOffer); i++) {
      if (!autoCheckout) {
        const { data } = await supabase
          .from("checkouts")
          .select("id, is_default")
          .eq("product_id", newProductId)
          .maybeSingle();
        autoCheckout = (data as Checkout) || null;
      }
      if (!autoOffer) {
        const { data } = await supabase
          .from("offers")
          .select("id, is_default, price")
          .eq("product_id", newProductId)
          .maybeSingle();
        autoOffer = (data as Offer) || null;
      }
      if (!autoCheckout || !autoOffer) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    if (!autoCheckout) {
      throw new Error("Timeout: checkout não foi criado por trigger");
    }

    // Copy offers
    const { data: srcOffers } = await supabase
      .from("offers")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "active");

    const offersArray = (srcOffers as Offer[]) ?? [];
    const srcDefaultOffer = offersArray.find((o) => o.is_default);
    if (srcDefaultOffer && autoOffer) {
      await supabase
        .from("offers")
        .update({ name: srcDefaultOffer.name, price: srcDefaultOffer.price, is_default: true })
        .eq("id", autoOffer.id);
    }

    for (const offer of offersArray.filter((o) => !o.is_default)) {
      await supabase.from("offers").insert({
        product_id: newProductId,
        name: offer.name,
        price: offer.price,
        is_default: false,
        status: "active",
      });
    }

    // Copy checkouts
    const { data: srcCheckouts } = await supabase
      .from("checkouts")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "active");

    const checkoutsArray = (srcCheckouts as Checkout[]) ?? [];
    const srcDefaultCheckout = checkoutsArray.find((c) => c.is_default);
    if (srcDefaultCheckout && autoCheckout) {
      const baseSlug = srcDefaultCheckout.slug || toSlug(srcProduct.name);
      const newSlug = await ensureUniqueSlug(supabase, "checkouts", "slug", baseSlug);

      await supabase
        .from("checkouts")
        .update({ name: srcDefaultCheckout.name, slug: newSlug, seller_name: srcDefaultCheckout.seller_name, is_default: true })
        .eq("id", autoCheckout.id);

      await cloneCheckoutDeep(supabase, srcDefaultCheckout.id, autoCheckout.id);
      await cloneCheckoutLinks(supabase, srcDefaultCheckout.id, autoCheckout.id, newSlug);
    }

    for (let i = 0; i < checkoutsArray.length; i++) {
      const ck = checkoutsArray[i];
      if (ck.is_default) continue;

      const baseSlug = ck.slug || `${toSlug(srcProduct.name)}-${i + 1}`;
      const newSlug = await ensureUniqueSlug(supabase, "checkouts", "slug", baseSlug);

      const { data: newCk, error: ckError } = await supabase
        .from("checkouts")
        .insert({
          product_id: newProductId,
          name: ck.name,
          slug: newSlug,
          seller_name: ck.seller_name,
          is_default: false,
          visits_count: 0,
          status: "active",
        })
        .select("id")
        .single();

      if (!ckError && newCk) {
        const newCkData = newCk as { id: string };
        await cloneCheckoutDeep(supabase, ck.id, newCkData.id);
        await cloneCheckoutLinks(supabase, ck.id, newCkData.id, newSlug);
      }
    }

    return { success: true, newProductId };

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { success: false, error: err.message };
  }
}
