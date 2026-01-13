/**
 * Product Duplicate Cloner
 * 
 * Clone functions for checkout rows, components, and links.
 * Extracted from product-duplicate-handlers.ts to keep files < 300 lines.
 * 
 * RISE Protocol Compliant - Zero `any` (except SupabaseClientAny documented)
 */

// deno-lint-ignore no-explicit-any
type SupabaseClientAny = any;

import { ensureUniqueSlug } from "./edge-helpers.ts";

// ============================================
// TYPES
// ============================================

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

export interface CheckoutLink {
  id: string;
  checkout_id: string;
  slug: string;
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
