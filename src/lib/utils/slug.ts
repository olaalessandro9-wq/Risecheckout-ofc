// Gera slugs "kebab-case" e garante unicidade consultando o banco
export function toSlug(input: string): string {
  return (input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function ensureUniqueSlug(
  supabase: any,
  table: string,
  column: string,
  baseSlug: string
): Promise<string> {
  let slug = toSlug(baseSlug) || "checkout";
  let suffix = 0;
  while (true) {
    const trySlug = suffix === 0 ? slug : `${slug}-${suffix}`;
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .eq(column, trySlug)
      .limit(1);
    if (error) break;
    if (!data || data.length === 0) return trySlug;
    suffix++;
  }
  return `${slug}-${crypto?.randomUUID?.().slice(0, 8) ?? Date.now()}`;
}
