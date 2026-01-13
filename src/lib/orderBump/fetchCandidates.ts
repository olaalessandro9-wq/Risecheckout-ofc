// Helper para carregar candidatos de Order Bump direto do Supabase.
// MIGRATED: Uses useAuth pattern - receives userId as parameter

import { supabase } from "@/integrations/supabase/client";

export type OrderBumpCandidate = {
  id: string;
  name: string;
  price: number;
  status?: string | null;
  image_url?: string | null;
  description?: string | null;
};

/**
 * Busca produtos para serem candidatos de Order Bump.
 * @param userId - ID do usuário autenticado (obrigatório)
 * @param excludeProductId - opcionalmente exclui o produto atual da lista
 */
export async function fetchOrderBumpCandidates(
  userId: string,
  opts?: { excludeProductId?: string }
): Promise<OrderBumpCandidate[]> {
  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  const excludeId = opts?.excludeProductId;

  let query = supabase
    .from("products")
    .select("id,name,price,image_url,description")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[OrderBump] load products failed:", error);
    throw error;
  }

  return (data ?? [])
    .filter((p) => Boolean(p && p.id && p.name))
    .map((p): OrderBumpCandidate => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      image_url: p.image_url,
      description: p.description,
    }));
}
