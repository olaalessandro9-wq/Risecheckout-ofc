/**
 * Pixels Context Test Factories
 * 
 * Type-safe factory functions for mocking PixelsContext and related types.
 * 
 * @module test/factories/pixelsContext
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// PIXEL TYPES (inferred from modules/tracking)
// ============================================================================

export type PixelPlatform = 
  | "facebook"
  | "google_ads"
  | "google_analytics"
  | "tiktok"
  | "kwai"
  | "taboola"
  | "utmify";

export interface Pixel {
  readonly id: string;
  readonly user_id: string;
  readonly platform: PixelPlatform;
  readonly pixel_id: string;
  readonly enabled: boolean;
  readonly domain: string | null;
  readonly fire_on_pix: boolean;
  readonly fire_on_card: boolean;
  readonly fire_on_boleto: boolean;
  readonly custom_value_pix: number | null;
  readonly custom_value_card: number | null;
  readonly custom_value_boleto: number | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface PixelFormData {
  platform: PixelPlatform;
  pixel_id: string;
  enabled: boolean;
  domain: string;
  fire_on_pix: boolean;
  fire_on_card: boolean;
  fire_on_boleto: boolean;
  custom_value_pix: number | null;
  custom_value_card: number | null;
  custom_value_boleto: number | null;
}

// ============================================================================
// PIXEL FACTORIES
// ============================================================================

export function createMockPixel(
  overrides?: Partial<Pixel>
): Pixel {
  return {
    id: "pixel-123",
    user_id: "user-123",
    platform: "facebook",
    pixel_id: "123456789",
    enabled: true,
    domain: null,
    fire_on_pix: true,
    fire_on_card: true,
    fire_on_boleto: false,
    custom_value_pix: null,
    custom_value_card: null,
    custom_value_boleto: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockPixelFormData(
  overrides?: Partial<PixelFormData>
): PixelFormData {
  return {
    platform: "facebook",
    pixel_id: "123456789",
    enabled: true,
    domain: "",
    fire_on_pix: true,
    fire_on_card: true,
    fire_on_boleto: false,
    custom_value_pix: null,
    custom_value_card: null,
    custom_value_boleto: null,
    ...overrides,
  };
}

// ============================================================================
// PIXELS MACHINE CONTEXT
// ============================================================================

export interface PixelsMachineContext {
  pixels: Pixel[];
  editingPixel: Pixel | null;
  deletingPixel: Pixel | null;
  isFormOpen: boolean;
  isSaving: boolean;
  error: string | null;
  selectedPlatformFilter: string;
}

export function createMockPixelsMachineContext(
  overrides?: Partial<PixelsMachineContext>
): PixelsMachineContext {
  return {
    pixels: [],
    editingPixel: null,
    deletingPixel: null,
    isFormOpen: false,
    isSaving: false,
    error: null,
    selectedPlatformFilter: "all",
    ...overrides,
  };
}

// ============================================================================
// PIXELS CONTEXT VALUE
// ============================================================================

export interface PixelsContextValue {
  // State
  readonly state: {
    readonly value: string;
    readonly context: PixelsMachineContext;
  };
  
  // Send
  readonly send: (event: { type: string; [key: string]: unknown }) => void;
  
  // Derived flags
  readonly isLoading: boolean;
  readonly isReady: boolean;
  readonly isError: boolean;
  readonly isSaving: boolean;
  
  // Data
  readonly pixels: Pixel[];
  readonly editingPixel: Pixel | null;
  readonly deletingPixel: Pixel | null;
  readonly isFormOpen: boolean;
  readonly error: string | null;
  readonly selectedPlatformFilter: string;
  
  // Computed
  readonly filteredPixels: Pixel[];
  
  // Actions
  readonly openForm: (pixel?: Pixel) => void;
  readonly closeForm: () => void;
  readonly savePixel: (data: PixelFormData) => void;
  readonly requestDelete: (pixel: Pixel) => void;
  readonly cancelDelete: () => void;
  readonly confirmDelete: () => void;
  readonly setPlatformFilter: (platform: string) => void;
  readonly refresh: () => void;
}

export function createMockPixelsContextValue(
  overrides?: Partial<PixelsContextValue>
): PixelsContextValue {
  const machineContext = createMockPixelsMachineContext();
  
  return {
    // State
    state: {
      value: "ready",
      context: machineContext,
    },
    
    // Send
    send: vi.fn(),
    
    // Derived flags
    isLoading: false,
    isReady: true,
    isError: false,
    isSaving: false,
    
    // Data
    pixels: [],
    editingPixel: null,
    deletingPixel: null,
    isFormOpen: false,
    error: null,
    selectedPlatformFilter: "all",
    
    // Computed
    filteredPixels: [],
    
    // Actions
    openForm: vi.fn(),
    closeForm: vi.fn(),
    savePixel: vi.fn(),
    requestDelete: vi.fn(),
    cancelDelete: vi.fn(),
    confirmDelete: vi.fn(),
    setPlatformFilter: vi.fn(),
    refresh: vi.fn(),
    
    ...overrides,
  };
}

// ============================================================================
// PIXELS MACHINE SNAPSHOT FACTORY
// ============================================================================

export interface MockPixelsSnapshot {
  context: PixelsMachineContext;
  value: string | Record<string, unknown>;
  matches: (state: string) => boolean;
  can: (event: { type: string }) => boolean;
  status: "active" | "done" | "error" | "stopped";
}

export function createMockPixelsSnapshot(
  context?: Partial<PixelsMachineContext>,
  stateValue: string | Record<string, unknown> = "ready"
): MockPixelsSnapshot {
  const fullContext = createMockPixelsMachineContext(context);
  
  return {
    context: fullContext,
    value: stateValue,
    matches: vi.fn((state: string) => {
      if (typeof stateValue === "string") {
        return state === stateValue;
      }
      return Object.keys(stateValue).includes(state);
    }),
    can: vi.fn(() => true),
    status: "active",
  };
}
