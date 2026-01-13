import { copyPublicObjectToNewPath } from "@/lib/supabase/storageHelpers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CheckoutCustomization } from "@/types/checkoutEditor";

/**
 * Tipo para valores primitivos e objetos aceitos durante o clone
 */
type CloneableValue = string | number | boolean | null | undefined | CloneableValue[] | { [key: string]: CloneableValue };

/**
 * Percorre o JSON de customização e copia URLs de imagem/asset para novos paths
 * retornando um novo JSON com URLs atualizadas.
 */
export async function cloneCustomizationWithImages(
  supabase: SupabaseClient,
  customization: CheckoutCustomization | null | undefined,
  newProductId: number | string
): Promise<CheckoutCustomization | null | undefined> {
  if (!customization) return customization;

  async function visit(node: CloneableValue): Promise<CloneableValue> {
    if (Array.isArray(node)) return Promise.all(node.map(visit));
    if (node && typeof node === "object") {
      const clone: Record<string, CloneableValue> = {};
      for (const [k, v] of Object.entries(node)) {
        if (k === "imageUrl" && typeof v === "string" && v) {
          clone[k] = await copyPublicObjectToNewPath(supabase, v, newProductId, "image");
        } else if (k === "src" && typeof v === "string" && v) {
          clone[k] = await copyPublicObjectToNewPath(supabase, v, newProductId, "asset");
        } else {
          clone[k] = await visit(v);
        }
      }
      return clone;
    }
    return node;
  }

  const result = await visit(customization as unknown as CloneableValue);
  return result as unknown as CheckoutCustomization;
}
