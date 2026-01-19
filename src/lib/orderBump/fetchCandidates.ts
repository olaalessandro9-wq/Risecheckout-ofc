/**
 * Helper para carregar candidatos de Order Bump
 * 
 * MIGRATED: Uses products-crud Edge Function instead of direct database access
 * 
 * @see RISE Protocol V3 - Zero console.log
 */

import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const log = createLogger("OrderBump");

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

  try {
    // MIGRATED: Use products-crud Edge Function via api.call
    const { data, error } = await api.call<{ error?: string; products?: Array<{ id: string; name: string; price: number; status?: string; image_url?: string; description?: string }> }>('products-crud', {
      action: 'list',
      excludeDeleted: true,
    });

    if (error) {
      log.error("Edge Function error:", error);
      throw new Error(error.message);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    const products = (data?.products ?? [])
      .filter((p: { id: string; status?: string }) => {
        // Filter out excluded product and non-active products
        if (excludeId && p.id === excludeId) return false;
        if (p.status !== 'active') return false;
        return true;
      })
      .map((p: { id: string; name: string; price: number; image_url?: string; description?: string }): OrderBumpCandidate => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        image_url: p.image_url,
        description: p.description,
      }));

    return products;
  } catch (error) {
    log.error("Load products failed:", error);
    throw error;
  }
}
