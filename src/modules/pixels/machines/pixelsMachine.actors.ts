/**
 * Pixels Machine Actors
 * 
 * @module modules/pixels/machines
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { fromPromise } from "xstate";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import type { VendorPixel, PixelPlatform } from "../types";
import type { 
  LoadPixelsOutput, 
  SavePixelOutput, 
  DeletePixelOutput,
  SavePixelInput,
  DeletePixelInput 
} from "./types";

const log = createLogger("PixelsActors");

// ============================================================================
// API TYPES
// ============================================================================

interface PixelsListResponse {
  pixels?: VendorPixel[];
  error?: string;
}

interface PixelActionResponse {
  error?: string;
}

// ============================================================================
// LOAD PIXELS ACTOR
// ============================================================================

export const loadPixelsActor = fromPromise<LoadPixelsOutput, void>(
  async () => {
    log.info("Carregando pixels...");

    const { data, error } = await api.call<PixelsListResponse>("pixel-management", {
      action: "list",
    });

    if (error) {
      log.error("Erro ao carregar pixels:", error);
      throw new Error(error.message ?? "Erro ao carregar pixels");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    // Cast para tipagem correta
    const pixels: VendorPixel[] = (data?.pixels ?? []).map((pixel) => ({
      ...pixel,
      platform: pixel.platform as PixelPlatform,
    }));

    log.info(`${pixels.length} pixels carregados`);
    return { pixels };
  }
);

// ============================================================================
// SAVE PIXEL ACTOR (Create or Update)
// ============================================================================

export const savePixelActor = fromPromise<SavePixelOutput, SavePixelInput>(
  async ({ input }) => {
    const { editingPixelId, data } = input;
    const isUpdate = !!editingPixelId;

    log.info(isUpdate ? "Atualizando pixel..." : "Criando pixel...", { 
      pixelId: editingPixelId, 
      platform: data.platform 
    });

    const payload = isUpdate
      ? {
          action: "update",
          pixelId: editingPixelId,
          data: {
            name: data.name,
            pixel_id: data.pixel_id,
            access_token: data.access_token || null,
            conversion_label: data.conversion_label || null,
            domain: data.domain || null,
            is_active: data.is_active,
          },
        }
      : {
          action: "create",
          data: {
            platform: data.platform,
            name: data.name,
            pixel_id: data.pixel_id,
            access_token: data.access_token || null,
            conversion_label: data.conversion_label || null,
            domain: data.domain || null,
            is_active: data.is_active,
          },
        };

    const { data: result, error } = await api.call<PixelActionResponse>(
      "pixel-management",
      payload
    );

    if (error) {
      log.error("Erro ao salvar pixel:", error);
      return { success: false, error: error.message ?? "Erro ao salvar pixel" };
    }

    if (result?.error) {
      return { success: false, error: result.error };
    }

    log.info("Pixel salvo com sucesso");
    return { success: true };
  }
);

// ============================================================================
// DELETE PIXEL ACTOR
// ============================================================================

export const deletePixelActor = fromPromise<DeletePixelOutput, DeletePixelInput>(
  async ({ input }) => {
    const { pixelId } = input;

    log.info("Excluindo pixel...", { pixelId });

    const { data: result, error } = await api.call<PixelActionResponse>(
      "pixel-management",
      {
        action: "delete",
        pixelId,
      }
    );

    if (error) {
      log.error("Erro ao excluir pixel:", error);
      return { success: false, error: error.message ?? "Erro ao excluir pixel" };
    }

    if (result?.error) {
      return { success: false, error: result.error };
    }

    log.info("Pixel excluído com sucesso");
    return { success: true };
  }
);
