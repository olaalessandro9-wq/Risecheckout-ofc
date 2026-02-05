 /**
  * Brand Assets - URLs centralizadas
  * 
  * Todos os assets oficiais da marca RiseCheckout.
  * Armazenados no Supabase Storage bucket 'brand-assets'.
  * 
  * @see RISE Protocol V3 - Single Source of Truth
  */
 
 const STORAGE_BASE = "https://wivbtmtgpsxupfjwwovf.supabase.co/storage/v1/object/public";
 const BUCKET = "brand-assets";
 
 export const BRAND_ASSETS = {
   /** Logo principal (fundo azul, texto branco) */
   LOGO_MAIN: `${STORAGE_BASE}/${BUCKET}/logo/main.jpg`,
   
   /** Alias para compatibilidade com código existente */
   EMAIL_BANNER: `${STORAGE_BASE}/${BUCKET}/logo/main.jpg`,
 } as const;
 
 /** Tipo para os assets disponíveis */
 export type BrandAssetKey = keyof typeof BRAND_ASSETS;
 
 /** Helper para obter URL de um asset */
 export function getBrandAssetUrl(asset: BrandAssetKey): string {
   return BRAND_ASSETS[asset];
 }