export async function ensureUniqueName(
  supabase: any,
  base: string,
): Promise<string> {
  let candidate = base;
  let suffix = 2; // começa em " (Cópia 2)" se já existir " (Cópia)"
  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("name", candidate)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return candidate;
    // Incrementa o sufixo se já existir
    candidate = base.includes('(Cópia)') ? `${base.replace(/\s*\(Cópia.*?\)/, '')} (Cópia ${suffix})` : `${base} (${suffix})`;
    suffix++;
  }
}
