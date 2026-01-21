/**
 * Pixels Machine Types
 * 
 * @module modules/pixels/machines
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import type { VendorPixel, PixelFormData } from "../types";

// ============================================================================
// CONTEXT
// ============================================================================

export interface PixelsMachineContext {
  /** Lista de pixels do vendedor */
  readonly pixels: VendorPixel[];
  
  /** Pixel sendo editado (para o form) */
  readonly editingPixel: VendorPixel | null;
  
  /** Pixel sendo deletado (para confirmação) */
  readonly deletingPixel: VendorPixel | null;
  
  /** Erro de carregamento/operação */
  readonly error: string | null;
  
  /** Timestamp do último refresh */
  readonly lastRefreshAt: number | null;
  
  /** Flag para indicar se o form está aberto */
  readonly isFormOpen: boolean;
  
  /** Flag para operação em andamento (create/update/delete) */
  readonly isSaving: boolean;
}

// ============================================================================
// EVENTS
// ============================================================================

export type PixelsMachineEvent =
  // Loading
  | { type: "LOAD" }
  | { type: "REFRESH" }
  | { type: "RETRY" }
  
  // Form
  | { type: "OPEN_FORM"; pixel?: VendorPixel }
  | { type: "CLOSE_FORM" }
  | { type: "SAVE_PIXEL"; data: PixelFormData }
  
  // Delete
  | { type: "REQUEST_DELETE"; pixel: VendorPixel }
  | { type: "CANCEL_DELETE" }
  | { type: "CONFIRM_DELETE" };

// ============================================================================
// ACTOR OUTPUTS
// ============================================================================

export interface LoadPixelsOutput {
  readonly pixels: VendorPixel[];
}

export interface SavePixelOutput {
  readonly success: boolean;
  readonly error?: string;
}

export interface DeletePixelOutput {
  readonly success: boolean;
  readonly error?: string;
}

// ============================================================================
// ACTOR INPUTS
// ============================================================================

export interface SavePixelInput {
  readonly editingPixelId: string | null;
  readonly data: PixelFormData;
}

export interface DeletePixelInput {
  readonly pixelId: string;
}

// ============================================================================
// INITIAL CONTEXT
// ============================================================================

export const initialPixelsContext: PixelsMachineContext = {
  pixels: [],
  editingPixel: null,
  deletingPixel: null,
  error: null,
  lastRefreshAt: null,
  isFormOpen: false,
  isSaving: false,
};
