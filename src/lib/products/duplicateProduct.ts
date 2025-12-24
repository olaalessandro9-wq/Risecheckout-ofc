import { ensureUniqueSlug, toSlug } from "@/lib/utils/slug";
import { cloneCustomizationWithImages } from "@/lib/checkout/cloneCustomization";
import { ensureUniqueName } from "@/lib/utils/uniqueName";
import { cloneCheckoutDeep } from "@/lib/checkouts/cloneCheckoutDeep";

type ProductRow = Record<string, any>;
type CheckoutRow = Record<string, any>;

async function cloneCheckoutLinksIfTableExists(
  supabase: any,
  srcCheckoutId: string,
  newCheckoutId: string,
  suggestedSlug: string
) {
  // checkout_links (prioritário)
  try {
    const { data: srcLinks } = await supabase
      .from("checkout_links")
      .select("*")
      .eq("checkout_id", srcCheckoutId);
    if (srcLinks?.length) {
      for (const link of srcLinks) {
        const newSlug = await ensureUniqueSlug(supabase, "checkout_links", "slug", suggestedSlug);
        const insert: any = { ...link, id: undefined, checkout_id: newCheckoutId, slug: newSlug };
        delete insert.created_at;
        delete insert.updated_at;
        await supabase.from("checkout_links").insert(insert);
      }
      return;
    }
  } catch {}
  // payment_links (fallback)
  try {
    const { data: payLinks } = await supabase
      .from("payment_links")
      .select("*")
      .eq("checkout_id", srcCheckoutId);
    if (payLinks?.length) {
      for (const link of payLinks) {
        const newSlug = await ensureUniqueSlug(supabase, "payment_links", "slug", suggestedSlug);
        const insert: any = { ...link, id: undefined, checkout_id: newCheckoutId, slug: newSlug };
        delete insert.created_at;
        delete insert.updated_at;
        await supabase.from("payment_links").insert(insert);
      }
    }
  } catch {}
}

export async function duplicateProductDeep(supabase: any, rawProductId: string | number) {
  // Garantir que productId é uma string UUID válida
  const productId = String(rawProductId).trim();
  
  if (!productId || productId === 'undefined' || productId === 'null') {
    console.error('[duplicateProductDeep] Invalid product ID:', rawProductId);
    throw new Error("ID do produto inválido");
  }

  console.log('[duplicateProductDeep] Starting duplication for product:', productId);

  // 0) Carrega produto origem (apenas colunas REAIS)
  const { data: srcProduct, error: selectError } = await supabase
    .from("products")
    .select("id, name, description, price, image_url, user_id, status, support_name, support_email")
    .eq("id", productId)
    .single();
  
  if (selectError) {
    console.error('[duplicateProductDeep] Database select failed:', selectError);
    throw new Error(`Falha ao buscar produto: ${selectError.message}`);
  }
  
  if (!srcProduct) {
    console.error('[duplicateProductDeep] Product not found for ID:', productId);
    throw new Error("Produto origem não encontrado");
  }

  console.log('[duplicateProductDeep] Source product loaded:', srcProduct.name);

  // 1) Preparar nome único (products NÃO tem 'slug')
  const baseName = `${srcProduct.name} (Cópia)`;
  const newName = await ensureUniqueName(supabase, baseName);
  console.log('[duplicateProductDeep] Unique name generated:', newName);

  // 2) Montar insert do produto do ZERO (só colunas REAIS de products)
  const productInsert = {
    name: newName,
    description: srcProduct.description ?? null,
    price: srcProduct.price,
    image_url: srcProduct.image_url ?? null,
    user_id: srcProduct.user_id,
    status: srcProduct.status ?? "active",
    support_name: srcProduct.support_name ?? null,
    support_email: srcProduct.support_email ?? null,
  };
  console.log('[duplicateProductDeep] productInsert keys:', Object.keys(productInsert));

  // 3) Inserir produto clone
  const { data: newProd, error: eIns } = await supabase
    .from("products")
    .insert(productInsert)
    .select("id, name")
    .single();

  if (eIns || !newProd) {
    console.error('[duplicateProductDeep] Insert product failed:', eIns);
    throw eIns ?? new Error("Falha ao criar produto clone");
  }

  const newProductId = newProd.id;
  console.log('[duplicateProductDeep] New product id:', newProductId);

  // 4) Aguardar checkout/offer criados por trigger (retry simples)
  console.log('[duplicateProductDeep] Waiting for trigger-created checkout/offer...');
  let autoCheckout: any = null;
  let autoOffer: any = null;
  
  for (let i = 0; i < 10 && (!autoCheckout || !autoOffer); i++) {
    if (!autoCheckout) {
      const { data } = await supabase
        .from("checkouts")
        .select("id, is_default")
        .eq("product_id", newProductId)
        .maybeSingle();
      autoCheckout = data || null;
    }
    if (!autoOffer) {
      const { data } = await supabase
        .from("offers")
        .select("id, is_default, price")
        .eq("product_id", newProductId)
        .maybeSingle();
      autoOffer = data || null;
    }
    if (!autoCheckout || !autoOffer) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  
  if (!autoCheckout) {
    throw new Error("Timeout: checkout não foi criado por trigger");
  }
  
  console.log('[duplicateProductDeep] Auto-created checkout:', autoCheckout?.id, 'offer:', autoOffer?.id);

  // 5) Copiar/Ajustar OFFERS (apenas ativas)
  const { data: srcOffers, error: eOffers } = await supabase
    .from("offers")
    .select("*")
    .eq("product_id", srcProduct.id)
    .eq("status", "active");  // ✅ Copiar apenas ofertas ativas

  if (eOffers) throw eOffers;

  // 5.1 Atualiza a offer default criada pelo trigger para espelhar a default do origem
  const srcDefaultOffer = (srcOffers ?? []).find((o: any) => o.is_default);
  if (srcDefaultOffer && autoOffer) {
    const patch: any = { 
      name: srcDefaultOffer.name ?? null,
      price: srcDefaultOffer.price, 
      is_default: true 
    };
    const { error: eUpd } = await supabase
      .from("offers")
      .update(patch)
      .eq("id", autoOffer.id);
    if (eUpd) {
      console.error('[duplicateProductDeep] update auto offer failed:', eUpd);
      throw eUpd;
    }
  }

  // 5.2 Insere as demais (não-default)
  for (const offer of (srcOffers ?? []).filter((o: any) => !o.is_default)) {
    const insertOffer: any = { 
      product_id: newProductId, 
      name: offer.name ?? null,
      price: offer.price, 
      is_default: false 
    };
    const { error: eIO } = await supabase.from("offers").insert(insertOffer);
    if (eIO) {
      console.error('[duplicateProductDeep] insert offer failed:', eIO, insertOffer);
      throw eIO;
    }
  }
  
  console.log('[duplicateProductDeep] offers copied/updated');

  // 6) Copiar/Ajustar CHECKOUTS (apenas ativos)
  const { data: srcCheckouts, error: eCk } = await supabase
    .from("checkouts")
    .select("*")
    .eq("product_id", srcProduct.id)
    .eq("status", "active");  // ✅ Copiar apenas checkouts ativos

  if (eCk) throw eCk;

  // 6.1 Atualiza o checkout default criado por trigger para espelhar o default do origem
  const srcDefaultCk = (srcCheckouts ?? []).find((c: any) => c.is_default);
  if (srcDefaultCk && autoCheckout) {
    // Slug único
    const baseSlug = srcDefaultCk.slug || toSlug(srcProduct.name);
    const newSlug = await ensureUniqueSlug(supabase, "checkouts", "slug", baseSlug);
    
    // Atualiza campos básicos
    const ckPatch: any = { 
      name: srcDefaultCk.name, 
      slug: newSlug,
      seller_name: srcDefaultCk.seller_name ?? null,
      is_default: true 
    };
    const { error: eUpdCk } = await supabase
      .from("checkouts")
      .update(ckPatch)
      .eq("id", autoCheckout.id);
    if (eUpdCk) {
      console.error('[duplicateProductDeep] update auto checkout failed:', eUpdCk);
      throw eUpdCk;
    }
    
    // 🔧 Clona "deep" usando RPC V5
    await cloneCheckoutDeep(supabase, srcDefaultCk.id, autoCheckout.id);
    
    // Clona links do checkout default
    if (srcDefaultCk.id) {
      await cloneCheckoutLinksIfTableExists(supabase, srcDefaultCk.id, autoCheckout.id, newSlug);
    }
  }

  // 6.2 Insere demais checkouts (não-default)
  for (let i = 0; i < (srcCheckouts ?? []).length; i++) {
    const ck = srcCheckouts[i];
    if (ck.is_default) continue; // já foi atualizado acima
    
    // Slug único
    const baseSlug = ck.slug || `${toSlug(srcProduct.name)}-${i + 1}`;
    const newSlug = await ensureUniqueSlug(supabase, "checkouts", "slug", baseSlug);
    
    // Cria esqueleto do checkout
    const insertCk: any = {
      product_id: newProductId,
      name: ck.name,
      slug: newSlug,
      seller_name: ck.seller_name ?? null,
      is_default: false,
      visits_count: 0,
    };
    const { data: newCk, error: eIC } = await supabase
      .from("checkouts")
      .insert(insertCk)
      .select("id")
      .single();
    if (eIC) {
      console.error('[duplicateProductDeep] insert checkout failed:', eIC, insertCk);
      throw eIC;
    }
    
    // 🔧 Clona "deep" usando RPC V5
    await cloneCheckoutDeep(supabase, ck.id, newCk.id);
    
    // Clona links
    if (ck.id && newCk?.id) {
      await cloneCheckoutLinksIfTableExists(supabase, ck.id, newCk.id, newSlug);
    }
  }
  
  console.log('[duplicateProductDeep] checkouts copied/updated');

  console.log('[duplicateProductDeep] Duplication completed successfully');
  return { newProductId };
}
