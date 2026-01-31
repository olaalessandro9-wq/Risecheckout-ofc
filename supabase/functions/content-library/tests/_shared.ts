/**
 * Content Library Tests - Shared Types and Utilities
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module content-library/tests/_shared
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ContentItem {
  id: string;
  title: string;
  content_url: string | null;
  is_active: boolean;
  module: {
    id: string;
    title: string;
    product_id: string;
  } | null;
}

export interface VideoItem {
  id: string;
  url: string;
  title: string;
  moduleTitle: string;
}

export interface Product {
  id: string;
  user_id: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const mockProducts: Product[] = [
  { id: "prod-1", user_id: "user-123" },
  { id: "prod-2", user_id: "user-456" },
];

export const mockContentItems: ContentItem[] = [
  {
    id: "content-1",
    title: "Aula 1 - Introdução",
    content_url: "https://vimeo.com/123",
    is_active: true,
    module: { id: "mod-1", title: "Módulo 1", product_id: "prod-1" },
  },
  {
    id: "content-2",
    title: "Aula 2 - Fundamentos",
    content_url: "https://vimeo.com/456",
    is_active: true,
    module: { id: "mod-1", title: "Módulo 1", product_id: "prod-1" },
  },
  {
    id: "content-3",
    title: "Aula 3 - Avançado",
    content_url: "https://vimeo.com/123",
    is_active: true,
    module: { id: "mod-2", title: "Módulo 2", product_id: "prod-1" },
  },
  {
    id: "content-4",
    title: "Aula de Outro Produto",
    content_url: "https://vimeo.com/789",
    is_active: true,
    module: { id: "mod-3", title: "Módulo Outro", product_id: "prod-2" },
  },
  {
    id: "content-5",
    title: "Aula Inativa",
    content_url: "https://vimeo.com/inactive",
    is_active: false,
    module: { id: "mod-1", title: "Módulo 1", product_id: "prod-1" },
  },
  {
    id: "content-6",
    title: "Aula Sem Vídeo",
    content_url: null,
    is_active: true,
    module: { id: "mod-1", title: "Módulo 1", product_id: "prod-1" },
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verifica ownership do produto
 */
export function verifyProductOwnership(productId: string, producerId: string): boolean {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) return false;
  return product.user_id === producerId;
}

/**
 * Filtra conteúdos por produto e remove duplicatas
 */
export function getVideoLibrary(
  items: ContentItem[],
  productId: string,
  excludeContentId?: string
): VideoItem[] {
  const videos: VideoItem[] = [];
  const seenUrls = new Set<string>();

  for (const item of items) {
    if (!item.module || Array.isArray(item.module)) continue;
    if (item.module.product_id !== productId) continue;
    if (excludeContentId && item.id === excludeContentId) continue;
    if (!item.content_url) continue;
    if (seenUrls.has(item.content_url)) continue;
    seenUrls.add(item.content_url);

    videos.push({
      id: item.id,
      url: item.content_url,
      title: item.title,
      moduleTitle: item.module.title,
    });
  }

  return videos;
}

/**
 * Filtra apenas conteúdos ativos
 */
export function filterActiveContent(items: ContentItem[]): ContentItem[] {
  return items.filter(item => item.is_active === true);
}
