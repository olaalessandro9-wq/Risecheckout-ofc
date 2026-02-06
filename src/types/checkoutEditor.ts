/**
 * Tipos do Editor de Checkout
 * 
 * Interfaces e tipos para o sistema de customização de checkouts.
 */

import type { CheckoutComponentContent, CheckoutComponentType } from "./checkout";
import type { CheckoutColors } from "./checkoutColors";

// ============================================================================
// VIEW MODE
// ============================================================================

export type ViewMode = "desktop" | "mobile" | "public";

export type CheckoutViewport = "desktop" | "mobile";

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface CheckoutComponent {
  id: string;
  type: CheckoutComponentType;
  content?: CheckoutComponentContent;
}

// ============================================================================
// DESIGN TYPES
// ============================================================================

export interface CheckoutDesign {
  theme: string;
  font: string;
  colors: CheckoutColors;
  backgroundImage?: { 
    url?: string; 
    fixed?: boolean; 
    repeat?: boolean; 
    expand?: boolean; 
  };
}

// ============================================================================
// CUSTOMIZATION AGGREGATE
// ============================================================================

export interface CheckoutCustomization {
  design: CheckoutDesign;
  topComponents: CheckoutComponent[];
  bottomComponents: CheckoutComponent[];
}
