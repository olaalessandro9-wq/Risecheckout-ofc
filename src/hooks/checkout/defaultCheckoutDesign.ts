/**
 * Default Checkout Design
 * 
 * Estado inicial padrão para customização de checkouts.
 * RISE V3 Compliant: Sincronizado 100% com themePresets.ts
 */

import type { CheckoutCustomization } from "@/types/checkoutEditor";

export const DEFAULT_CHECKOUT_DESIGN: CheckoutCustomization = {
  design: {
    theme: "custom",
    font: "Inter",
    colors: {
      background: "#FFFFFF",
      primaryText: "#000000",
      secondaryText: "#6B7280",
      active: "#10B981",
      icon: "#000000",
      formBackground: "#F9FAFB",
      border: "#E5E7EB",
      placeholder: "rgba(0,0,0,0.05)",
      inputBackground: "#F9FAFB",
      unselectedButton: { 
        text: "#000000", 
        background: "#FFFFFF", 
        icon: "#000000" 
      },
      selectedButton: { 
        text: "#FFFFFF", 
        background: "#10B981", 
        icon: "#FFFFFF" 
      },
      box: { 
        headerBg: "#F3F4F6", 
        headerPrimaryText: "#111827", 
        headerSecondaryText: "#6B7280", 
        bg: "#FFFFFF", 
        primaryText: "#111827", 
        secondaryText: "#6B7280" 
      },
      unselectedBox: { 
        headerBg: "#F9FAFB", 
        headerPrimaryText: "#374151", 
        headerSecondaryText: "#9CA3AF", 
        bg: "#FFFFFF", 
        primaryText: "#374151", 
        secondaryText: "#9CA3AF" 
      },
      selectedBox: { 
        headerBg: "#10B981", 
        headerPrimaryText: "#FFFFFF", 
        headerSecondaryText: "#ECFDF5", 
        bg: "#F0FDF4", 
        primaryText: "#047857", 
        secondaryText: "#059669" 
      },
      button: { 
        background: "#10B981", 
        text: "#FFFFFF" 
      },
      orderSummary: {
        background: "#F9FAFB",
        titleText: "#000000",
        productName: "#000000",
        priceText: "#000000",
        labelText: "#6B7280",
        borderColor: "#D1D5DB",
      },
      footer: {
        background: "#F9FAFB",
        primaryText: "#000000",
        secondaryText: "#6B7280",
        border: "#E5E7EB",
      },
      securePurchase: {
        headerBackground: "#10B981",
        headerText: "#FFFFFF",
        cardBackground: "#FFFFFF",
        primaryText: "#000000",
        secondaryText: "#6B7280",
        linkText: "#3B82F6",
      },
      orderBump: {
        headerBackground: 'rgba(0,0,0,0.15)', 
        headerText: '#10B981', 
        footerBackground: 'rgba(0,0,0,0.15)', 
        footerText: '#000000',
        contentBackground: '#F9FAFB', 
        titleText: '#000000', 
        descriptionText: '#6B7280', 
        priceText: '#10B981',
        selectedHeaderBackground: '#10B981',
        selectedHeaderText: '#FFFFFF',
        selectedFooterBackground: '#10B981',
        selectedFooterText: '#FFFFFF',
      },
      creditCardFields: { 
        textColor: '#000000', 
        placeholderColor: '#6B7280', 
        borderColor: '#D1D5DB', 
        backgroundColor: '#FFFFFF', 
        focusBorderColor: '#10B981', 
        focusTextColor: '#000000' 
      },
      personalDataFields: {
        textColor: '#000000',
        placeholderColor: '#6B7280',
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
        focusBorderColor: '#10B981',
        focusTextColor: '#000000',
      },
      infoBox: {
        background: '#ECFDF5',
        border: '#A7F3D0',
        text: '#047857',
      },
      productPrice: '#10B981',
    },
  },
  topComponents: [],
  bottomComponents: [],
};
