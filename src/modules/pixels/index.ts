/**
 * Pixels Module - Barrel Export
 * 
 * @module modules/pixels
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Módulo de gerenciamento de pixels de rastreamento.
 * Fornece SSOT via XState machine.
 */

// Context
export { PixelsProvider, usePixelsContext } from "./context/PixelsContext";

// Components
export { 
  PixelLibrary, 
  PixelForm, 
  PixelCard, 
  PlatformIcon 
} from "./components";

// Types
export * from "./types";

// Machine (for testing/debugging)
export { pixelsMachine } from "./machines";
export type { 
  PixelsMachineContext, 
  PixelsMachineEvent 
} from "./machines/types";
