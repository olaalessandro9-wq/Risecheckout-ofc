/**
 * BuilderMachine Actors (Dual-Layout Version)
 * 
 * Async actors for loading and saving builder data.
 * Supports independent Desktop/Mobile layouts.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 * @module members-area-builder/machines
 */

import { fromPromise } from "xstate";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import { toast } from "sonner";
import type { 
  LoadBuilderInput, 
  LoadBuilderOutput,
  SaveBuilderInput,
  SaveBuilderOutput,
} from "./builderMachine.types";
import type { 
  Section,
  Viewport,
  MembersAreaBuilderSettings,
  MemberModule,
  BannerSettings,
  ModulesSettings,
} from "../types/builder.types";
import { parseSections, parseSettings } from "../hooks/useMembersAreaParsers";

const log = createLogger("BuilderMachine.actors");

// ============================================================================
// AUTO-INITIALIZATION HELPER
// ============================================================================

/**
 * Generates default sections when a product has no saved sections
 * but has modules or a product image available.
 */
function generateDefaultSections(
  productId: string,
  productImageUrl: string | null,
  modules: MemberModule[],
  viewport: Viewport
): Section[] {
  const sections: Section[] = [];
  const now = new Date().toISOString();
  
  // 1. Banner with product image
  const bannerSettings: BannerSettings = {
    type: 'banner',
    slides: [{
      id: crypto.randomUUID(),
      image_url: productImageUrl || '',
      link: '',
      alt: 'Banner do curso',
    }],
    transition_seconds: 5,
    height: 'medium',
  };
  
  sections.push({
    id: `temp_${crypto.randomUUID()}`,
    product_id: productId,
    type: 'banner',
    viewport,
    title: null,
    position: 0,
    settings: bannerSettings,
    is_active: true,
    created_at: now,
    updated_at: now,
  });
  
  // 2. Modules section (if modules exist)
  if (modules.length > 0) {
    const modulesSettings: ModulesSettings = {
      type: 'modules',
      course_id: null,
      show_title: 'always',
      cards_per_row: 4,
      show_progress: true,
      module_order: modules.map(m => m.id),
      hidden_module_ids: [],
    };
    
    sections.push({
      id: `temp_${crypto.randomUUID()}`,
      product_id: productId,
      type: 'modules',
      viewport,
      title: 'Seus Cursos',
      position: 1,
      settings: modulesSettings,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
  }
  
  return sections;
}

// ============================================================================
// LOAD BUILDER ACTOR
// ============================================================================

export const loadBuilderActor = fromPromise<LoadBuilderOutput, LoadBuilderInput>(
  async ({ input }) => {
    const { productId } = input;

    if (!productId) {
      throw new Error("Product ID não fornecido");
    }

    // Load sections, settings and product image URL
    const { data, error } = await api.call<{ 
      error?: string; 
      sections?: unknown[]; 
      settings?: unknown;
      productImageUrl?: string | null;
    }>("admin-data", {
      action: "members-area-data",
      productId,
    });

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);

    const allSections = parseSections(data?.sections || []);
    const parsedSettings = parseSettings(data?.settings);
    const productImageUrl = data?.productImageUrl || null;

    // Load modules
    const { data: modulesData, error: modulesError } = await api.call<{ 
      error?: string; 
      modules?: unknown[];
    }>("admin-data", {
      action: "members-area-modules",
      productId,
    });

    if (modulesError) {
      log.warn("Failed to load modules:", modulesError);
    }

    const modules = (modulesData?.modules || []) as MemberModule[];

    // Separate sections by viewport
    let desktopSections = allSections.filter(s => s.viewport === 'desktop');
    let mobileSections = allSections.filter(s => s.viewport === 'mobile');
    
    // Determine if mobile is synced (no independent mobile sections yet)
    let isMobileSynced = mobileSections.length === 0;

    // AUTO-INITIALIZATION: Generate default sections if none exist
    if (desktopSections.length === 0 && (modules.length > 0 || productImageUrl)) {
      log.info("Auto-initializing builder with default sections", { 
        modulesCount: modules.length, 
        hasProductImage: !!productImageUrl 
      });
      
      desktopSections = generateDefaultSections(productId, productImageUrl, modules, 'desktop');
      mobileSections = generateDefaultSections(productId, productImageUrl, modules, 'mobile');
      isMobileSynced = true;
      
      toast.info("Layout inicial criado! Personalize como quiser.");
    }
    
    // If mobile is empty but desktop has content, sync is enabled
    if (mobileSections.length === 0 && desktopSections.length > 0) {
      mobileSections = desktopSections.map(s => ({
        ...s,
        id: `temp_${crypto.randomUUID()}`,
        viewport: 'mobile' as Viewport,
      }));
      isMobileSynced = true;
    }

    return {
      desktopSections,
      mobileSections,
      settings: parsedSettings,
      modules,
      productImageUrl,
      isMobileSynced,
    };
  }
);

// ============================================================================
// SAVE BUILDER ACTOR
// ============================================================================

export const saveBuilderActor = fromPromise<SaveBuilderOutput, SaveBuilderInput>(
  async ({ input }) => {
    const { 
      productId, 
      desktopSections, 
      mobileSections, 
      settings, 
      originalDesktopSections,
      originalMobileSections,
    } = input;

    if (!productId) {
      throw new Error("Product ID não fornecido");
    }

    // Combine all sections for saving
    const allSections = [...desktopSections, ...mobileSections];
    const originalAllSections = [...originalDesktopSections, ...originalMobileSections];

    // Get deleted section IDs
    const originalIds = new Set(originalAllSections.map(s => s.id));
    const currentIds = new Set(allSections.map(s => s.id));
    const deletedIds = [...originalIds].filter(id => !currentIds.has(id) && !id.startsWith('temp_'));

    // Save sections
    const { data: sectionsResult, error: sectionsError } = await api.call<{ 
      success?: boolean; 
      error?: string; 
      insertedIdMap?: Record<string, string>;
    }>("members-area-modules", {
      action: "save-sections",
      productId,
      sections: allSections,
      deletedIds,
    });

    if (sectionsError || !sectionsResult?.success) {
      throw new Error(sectionsResult?.error || sectionsError?.message || "Erro ao salvar seções");
    }

    const insertedIdMap = new Map(Object.entries(sectionsResult?.insertedIdMap || {}));

    // Save settings
    const { data: settingsResult, error: settingsError } = await api.call<{ 
      success?: boolean; 
      error?: string;
    }>("members-area-modules", {
      action: "save-builder-settings",
      productId,
      settings,
    });

    if (settingsError || !settingsResult?.success) {
      throw new Error(settingsResult?.error || settingsError?.message || "Erro ao salvar configurações");
    }

    // Update sections with real IDs
    const updatedDesktopSections = desktopSections.map(s => {
      const realId = insertedIdMap.get(s.id);
      return realId ? { ...s, id: realId } : s;
    });

    const updatedMobileSections = mobileSections.map(s => {
      const realId = insertedIdMap.get(s.id);
      return realId ? { ...s, id: realId } : s;
    });

    toast.success("Alterações salvas");

    return {
      success: true,
      updatedDesktopSections,
      updatedMobileSections,
    };
  }
);
