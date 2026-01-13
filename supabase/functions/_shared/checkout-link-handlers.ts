/**
 * Payment link handlers for checkout-crud Edge Function
 * Extracted for RISE Protocol compliance (< 300 lines per file)
 */

// ============================================
// SLUG GENERATION
// ============================================

export function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

// ============================================
// PAYMENT LINK MANAGEMENT
// ============================================

export async function managePaymentLink(
  supabase: any,
  checkoutId: string,
  offerId: string,
  baseUrl: string
): Promise<{ success: boolean; linkId?: string; error?: string }> {
  try {
    // Check current link
    const { data: currentLink } = await supabase
      .from("checkout_links")
      .select(`link_id, payment_links!inner (id, offer_id)`)
      .eq("checkout_id", checkoutId)
      .maybeSingle();

    // If current link already uses this offer, return it
    if (currentLink && currentLink.payment_links?.offer_id === offerId) {
      return { success: true, linkId: currentLink.link_id };
    }

    // Check if offer is used by another checkout
    const { data: offerInUse } = await supabase
      .from("checkout_links")
      .select(`id, payment_links!inner (offer_id)`)
      .eq("payment_links.offer_id", offerId)
      .neq("checkout_id", checkoutId)
      .maybeSingle();

    let linkId: string;

    if (offerInUse) {
      // Offer is in use - create new link
      const slug = generateSlug();
      const { data: newLink, error: createLinkError } = await supabase
        .from("payment_links")
        .insert({
          offer_id: offerId,
          slug,
          url: `${baseUrl}/c/${slug}`,
          status: "active",
          is_original: false,
        })
        .select("id")
        .single();

      if (createLinkError) {
        return { success: false, error: `Failed to create payment link: ${createLinkError.message}` };
      }
      linkId = newLink.id;
    } else {
      // Offer not in use - try to find available link or create
      const { data: availableLink } = await supabase
        .from("payment_links")
        .select("id")
        .eq("offer_id", offerId)
        .eq("status", "active")
        .maybeSingle();

      if (availableLink) {
        linkId = availableLink.id;
      } else {
        const slug = generateSlug();
        const { data: newLink, error: createLinkError } = await supabase
          .from("payment_links")
          .insert({
            offer_id: offerId,
            slug,
            url: `${baseUrl}/c/${slug}`,
            status: "active",
            is_original: true,
          })
          .select("id")
          .single();

        if (createLinkError) {
          return { success: false, error: `Failed to create payment link: ${createLinkError.message}` };
        }
        linkId = newLink.id;
      }
    }

    // Associate link with checkout
    if (currentLink) {
      const { error: updateError } = await supabase
        .from("checkout_links")
        .update({ link_id: linkId })
        .eq("checkout_id", checkoutId);

      if (updateError) {
        return { success: false, error: `Failed to update link association: ${updateError.message}` };
      }
    } else {
      const { error: insertError } = await supabase
        .from("checkout_links")
        .insert({ checkout_id: checkoutId, link_id: linkId });

      if (insertError) {
        return { success: false, error: `Failed to create link association: ${insertError.message}` };
      }
    }

    return { success: true, linkId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
