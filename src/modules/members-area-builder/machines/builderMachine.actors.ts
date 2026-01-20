/**
 * BuilderMachine Actors
 * 
 * Async actors for loading and saving builder data.
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
  MembersAreaBuilderSettings,
  MemberModule,
} from "../types/builder.types";
import { parseSections, parseSettings } from "../hooks/useMembersAreaParsers";

const log = createLogger("BuilderMachine.actors");

// ============================================================================
// LOAD BUILDER ACTOR
// ============================================================================

export const loadBuilderActor = fromPromise<LoadBuilderOutput, LoadBuilderInput>(
  async ({ input }) => {
    const { productId } = input;

    if (!productId) {
      throw new Error("Product ID não fornecido");
    }

    // Load sections and settings
    const { data, error } = await api.call<{ 
      error?: string; 
      sections?: unknown[]; 
      settings?: unknown;
    }>("admin-data", {
      action: "members-area-data",
      productId,
    });

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);

    const parsedSections = parseSections(data?.sections || []);
    const parsedSettings = parseSettings(data?.settings);

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

    return {
      sections: parsedSections,
      settings: parsedSettings,
      modules,
    };
  }
);

// ============================================================================
// SAVE BUILDER ACTOR
// ============================================================================

export const saveBuilderActor = fromPromise<SaveBuilderOutput, SaveBuilderInput>(
  async ({ input }) => {
    const { productId, sections, settings, originalSections } = input;

    if (!productId) {
      throw new Error("Product ID não fornecido");
    }

    // 1. Get deleted section IDs (in original but not in current)
    const originalIds = new Set(originalSections.map(s => s.id));
    const currentIds = new Set(sections.map(s => s.id));
    const deletedIds = [...originalIds].filter(id => !currentIds.has(id));

    // 2. Save sections
    const { data: sectionsResult, error: sectionsError } = await api.call<{ 
      success?: boolean; 
      error?: string; 
      insertedIdMap?: Record<string, string>;
    }>("members-area-modules", {
      action: "save-sections",
      productId,
      sections,
      deletedIds,
    });

    if (sectionsError || !sectionsResult?.success) {
      throw new Error(sectionsResult?.error || sectionsError?.message || "Erro ao salvar seções");
    }

    const insertedIdMap = new Map(Object.entries(sectionsResult?.insertedIdMap || {}));

    // 3. Save settings
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

    // 4. Update sections with real IDs
    const updatedSections = sections.map(s => {
      const realId = insertedIdMap.get(s.id);
      return realId ? { ...s, id: realId } : s;
    });

    toast.success("Alterações salvas");

    return {
      success: true,
      updatedSections,
    };
  }
);
