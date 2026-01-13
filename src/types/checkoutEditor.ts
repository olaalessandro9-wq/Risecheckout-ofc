/**
 * Tipos do Editor de Checkout
 * 
 * Interfaces e tipos para o sistema de customização de checkouts.
 */

import type { CheckoutComponentContent, CheckoutComponentType } from "./checkout";

// ============================================================================
// VIEW MODE
// ============================================================================

export type ViewMode = "desktop" | "mobile" | "public";

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
  colors: {
    background: string;
    primaryText: string;
    secondaryText: string;
    active: string;
    icon: string;
    formBackground: string;
    border: string;
    unselectedButton: { text: string; background: string; icon: string };
    selectedButton: { text: string; background: string; icon: string };
    box: { 
      headerBg: string; 
      headerPrimaryText: string; 
      headerSecondaryText: string; 
      bg: string; 
      primaryText: string; 
      secondaryText: string; 
    };
    unselectedBox: { 
      headerBg: string; 
      headerPrimaryText: string; 
      headerSecondaryText: string; 
      bg: string; 
      primaryText: string; 
      secondaryText: string; 
    };
    selectedBox: { 
      headerBg: string; 
      headerPrimaryText: string; 
      headerSecondaryText: string; 
      bg: string; 
      primaryText: string; 
      secondaryText: string; 
    };
    button: { background: string; text: string };
    orderSummary?: { 
      background: string; 
      titleText: string; 
      productName: string; 
      priceText: string; 
      labelText: string; 
      borderColor: string; 
    };
    footer?: { 
      background: string; 
      primaryText: string; 
      secondaryText: string; 
      border: string; 
    };
    securePurchase?: { 
      headerBackground: string; 
      headerText: string; 
      cardBackground: string; 
      primaryText: string; 
      secondaryText: string; 
      linkText: string; 
    };
    orderBump: { 
      headerBackground: string; 
      headerText: string; 
      footerBackground: string; 
      footerText: string; 
      contentBackground: string; 
      titleText: string; 
      descriptionText: string; 
      priceText: string; 
      selectedHeaderBackground?: string; 
      selectedHeaderText?: string; 
      selectedFooterBackground?: string; 
      selectedFooterText?: string; 
    };
    creditCardFields?: { 
      textColor?: string; 
      placeholderColor?: string; 
      borderColor?: string; 
      backgroundColor?: string; 
      focusBorderColor?: string; 
      focusTextColor?: string; 
    };
    personalDataFields?: { 
      textColor?: string; 
      placeholderColor?: string; 
      borderColor?: string; 
      backgroundColor?: string; 
      focusBorderColor?: string; 
      focusTextColor?: string; 
    };
    infoBox?: { background: string; border: string; text: string };
    inputBackground?: string;
    placeholder?: string;
    productPrice?: string;
  };
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
