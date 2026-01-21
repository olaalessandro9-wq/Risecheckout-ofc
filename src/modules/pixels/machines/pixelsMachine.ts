/**
 * Pixels State Machine
 * 
 * @module modules/pixels/machines
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Gerencia estado centralizado do módulo de pixels (SSOT).
 */

import { setup, assign } from "xstate";
import { toast } from "sonner";
import { loadPixelsActor, savePixelActor, deletePixelActor } from "./pixelsMachine.actors";
import { initialPixelsContext } from "./types";
import type { PixelsMachineContext, PixelsMachineEvent } from "./types";

// ============================================================================
// MACHINE DEFINITION
// ============================================================================

export const pixelsMachine = setup({
  types: {
    context: {} as PixelsMachineContext,
    events: {} as PixelsMachineEvent,
  },
  actors: {
    loadPixels: loadPixelsActor,
    savePixel: savePixelActor,
    deletePixel: deletePixelActor,
  },
  actions: {
    // Loading
    assignPixels: assign({
      pixels: (_, params: { pixels: PixelsMachineContext["pixels"] }) => params.pixels,
      lastRefreshAt: () => Date.now(),
      error: () => null,
    }),
    assignLoadError: assign({
      error: (_, params: { message: string }) => params.message,
    }),
    
    // Form
    openForm: assign({
      isFormOpen: () => true,
      editingPixel: (_, params: { pixel?: PixelsMachineContext["editingPixel"] }) => 
        params.pixel ?? null,
    }),
    closeForm: assign({
      isFormOpen: () => false,
      editingPixel: () => null,
    }),
    setSaving: assign({
      isSaving: (_, params: { value: boolean }) => params.value,
    }),
    
    // Delete
    setDeletingPixel: assign({
      deletingPixel: (_, params: { pixel: PixelsMachineContext["deletingPixel"] }) => 
        params.pixel,
    }),
    clearDeletingPixel: assign({
      deletingPixel: () => null,
    }),
    
    // Toasts
    showSuccessToast: (_, params: { message: string }) => {
      toast.success(params.message);
    },
    showErrorToast: (_, params: { message: string }) => {
      toast.error(params.message);
    },
  },
}).createMachine({
  id: "pixels",
  initial: "idle",
  context: initialPixelsContext,

  states: {
    // ========================================================================
    // IDLE - Estado inicial, aguarda comando de carregamento
    // ========================================================================
    idle: {
      on: {
        LOAD: { target: "loading" },
      },
    },

    // ========================================================================
    // LOADING - Carregando lista de pixels
    // ========================================================================
    loading: {
      invoke: {
        id: "loadPixels",
        src: "loadPixels",
        onDone: {
          target: "ready",
          actions: [
            {
              type: "assignPixels",
              params: ({ event }) => ({ pixels: event.output.pixels }),
            },
          ],
        },
        onError: {
          target: "error",
          actions: [
            {
              type: "assignLoadError",
              params: ({ event }) => ({ 
                message: (event.error as Error)?.message ?? "Erro ao carregar pixels" 
              }),
            },
            {
              type: "showErrorToast",
              params: { message: "Erro ao carregar pixels" },
            },
          ],
        },
      },
    },

    // ========================================================================
    // READY - Pronto para interações
    // ========================================================================
    ready: {
      on: {
        REFRESH: { target: "loading" },
        
        OPEN_FORM: {
          actions: [
            {
              type: "openForm",
              params: ({ event }) => ({ pixel: event.pixel }),
            },
          ],
        },
        
        CLOSE_FORM: {
          actions: ["closeForm"],
        },
        
        SAVE_PIXEL: { target: "saving" },
        
        REQUEST_DELETE: {
          actions: [
            {
              type: "setDeletingPixel",
              params: ({ event }) => ({ pixel: event.pixel }),
            },
          ],
        },
        
        CANCEL_DELETE: {
          actions: ["clearDeletingPixel"],
        },
        
        CONFIRM_DELETE: { target: "deleting" },
      },
    },

    // ========================================================================
    // SAVING - Salvando pixel (create ou update)
    // ========================================================================
    saving: {
      entry: [{ type: "setSaving", params: { value: true } }],
      exit: [{ type: "setSaving", params: { value: false } }],
      
      invoke: {
        id: "savePixel",
        src: "savePixel",
        input: ({ context, event }) => {
          if (event.type !== "SAVE_PIXEL") {
            throw new Error("Invalid event type for saving");
          }
          return {
            editingPixelId: context.editingPixel?.id ?? null,
            data: event.data,
          };
        },
        onDone: [
          {
            guard: ({ event }) => event.output.success,
            target: "loading",
            actions: [
              "closeForm",
              {
                type: "showSuccessToast",
                params: ({ context }) => ({ 
                  message: context.editingPixel 
                    ? "Pixel atualizado com sucesso!" 
                    : "Pixel cadastrado com sucesso!" 
                }),
              },
            ],
          },
          {
            target: "ready",
            actions: [
              {
                type: "showErrorToast",
                params: ({ event }) => ({ 
                  message: event.output.error ?? "Erro ao salvar pixel" 
                }),
              },
            ],
          },
        ],
        onError: {
          target: "ready",
          actions: [
            {
              type: "showErrorToast",
              params: { message: "Erro ao salvar pixel" },
            },
          ],
        },
      },
    },

    // ========================================================================
    // DELETING - Excluindo pixel
    // ========================================================================
    deleting: {
      entry: [{ type: "setSaving", params: { value: true } }],
      exit: [{ type: "setSaving", params: { value: false } }],
      
      invoke: {
        id: "deletePixel",
        src: "deletePixel",
        input: ({ context }) => {
          if (!context.deletingPixel) {
            throw new Error("No pixel to delete");
          }
          return { pixelId: context.deletingPixel.id };
        },
        onDone: [
          {
            guard: ({ event }) => event.output.success,
            target: "loading",
            actions: [
              "clearDeletingPixel",
              {
                type: "showSuccessToast",
                params: { message: "Pixel excluído com sucesso!" },
              },
            ],
          },
          {
            target: "ready",
            actions: [
              "clearDeletingPixel",
              {
                type: "showErrorToast",
                params: ({ event }) => ({ 
                  message: event.output.error ?? "Erro ao excluir pixel" 
                }),
              },
            ],
          },
        ],
        onError: {
          target: "ready",
          actions: [
            "clearDeletingPixel",
            {
              type: "showErrorToast",
              params: { message: "Erro ao excluir pixel" },
            },
          ],
        },
      },
    },

    // ========================================================================
    // ERROR - Erro de carregamento
    // ========================================================================
    error: {
      on: {
        RETRY: { target: "loading" },
      },
    },
  },
});

export type PixelsMachine = typeof pixelsMachine;
