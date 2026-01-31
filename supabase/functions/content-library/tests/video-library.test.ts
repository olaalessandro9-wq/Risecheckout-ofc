/**
 * Content Library - Video Library Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module content-library/tests/video-library
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mockContentItems, getVideoLibrary, filterActiveContent, type ContentItem } from "./_shared.ts";

Deno.test("content-library - Video Library", async (t) => {
  const activeItems = filterActiveContent(mockContentItems);

  await t.step("deve filtrar apenas conteúdos ativos", () => {
    assertEquals(activeItems.length, 5);
  });

  await t.step("deve filtrar por product_id", () => {
    const videos = getVideoLibrary(activeItems, "prod-1");
    assertEquals(videos.length, 2);
  });

  await t.step("deve excluir URLs duplicadas", () => {
    const videos = getVideoLibrary(activeItems, "prod-1");
    const urls = videos.map(v => v.url);
    const uniqueUrls = new Set(urls);
    assertEquals(urls.length, uniqueUrls.size);
  });

  await t.step("deve excluir conteúdo especificado via excludeContentId", () => {
    const videos = getVideoLibrary(activeItems, "prod-1", "content-1");
    const hasExcluded = videos.some(v => v.id === "content-1");
    assertEquals(hasExcluded, false);
  });

  await t.step("deve incluir moduleTitle no resultado", () => {
    const videos = getVideoLibrary(activeItems, "prod-1");
    for (const video of videos) {
      assertExists(video.moduleTitle);
    }
  });

  await t.step("deve retornar array vazio para produto sem vídeos", () => {
    const videos = getVideoLibrary(activeItems, "prod-sem-videos");
    assertEquals(videos.length, 0);
  });
});

Deno.test("content-library - Content Filtering", async (t) => {
  await t.step("deve ignorar conteúdos sem content_url", () => {
    const activeItems = filterActiveContent(mockContentItems);
    const videos = getVideoLibrary(activeItems, "prod-1");
    
    const hasNullUrl = videos.some(v => !v.url);
    assertEquals(hasNullUrl, false);
  });

  await t.step("deve ignorar conteúdos sem módulo", () => {
    const itemSemModulo: ContentItem = {
      id: "content-sem-modulo",
      title: "Sem Módulo",
      content_url: "https://vimeo.com/semmodulo",
      is_active: true,
      module: null,
    };
    
    const items = [...filterActiveContent(mockContentItems), itemSemModulo];
    const videos = getVideoLibrary(items, "prod-1");
    
    const hasSemModulo = videos.some(v => v.id === "content-sem-modulo");
    assertEquals(hasSemModulo, false);
  });

  await t.step("deve ignorar conteúdos de outros produtos", () => {
    const activeItems = filterActiveContent(mockContentItems);
    const videos = getVideoLibrary(activeItems, "prod-1");
    
    const hasOutroProduto = videos.some(v => v.id === "content-4");
    assertEquals(hasOutroProduto, false);
  });
});

Deno.test("content-library - Video Item Structure", async (t) => {
  const activeItems = filterActiveContent(mockContentItems);
  const videos = getVideoLibrary(activeItems, "prod-1");

  await t.step("deve conter id", () => {
    for (const video of videos) {
      assertExists(video.id);
      assertEquals(typeof video.id, "string");
    }
  });

  await t.step("deve conter url", () => {
    for (const video of videos) {
      assertExists(video.url);
      assertEquals(typeof video.url, "string");
    }
  });

  await t.step("deve conter title", () => {
    for (const video of videos) {
      assertExists(video.title);
      assertEquals(typeof video.title, "string");
    }
  });

  await t.step("deve conter moduleTitle", () => {
    for (const video of videos) {
      assertExists(video.moduleTitle);
      assertEquals(typeof video.moduleTitle, "string");
    }
  });
});
