export async function ensureUniqueCheckoutName(
  supabase: any,
  productId: string,
  base: string
): Promise<string> {
  let candidate = base;
  let suffix = 2;
  while (true) {
    const { data, error } = await supabase
      .from("checkouts")
      .select("id")
      .eq("product_id", productId)
      .eq("name", candidate)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return candidate;
    candidate = base.includes("(Cópia)")
      ? `${base.replace(/\s*\(Cópia.*?\)/, "")} (Cópia ${suffix})`
      : `${base} (${suffix})`;
    suffix++;
  }
}
