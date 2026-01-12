/**
 * Default Checkout Design
 * 
 * Estado inicial padrão para customização de checkouts.
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
        headerBg: "#1A1A1A", 
        headerPrimaryText: "#FFFFFF", 
        headerSecondaryText: "#CCCCCC", 
        bg: "#0A0A0A", 
        primaryText: "#FFFFFF", 
        secondaryText: "#CCCCCC" 
      },
      unselectedBox: { 
        headerBg: "#1A1A1A", 
        headerPrimaryText: "#FFFFFF", 
        headerSecondaryText: "#CCCCCC", 
        bg: "#0A0A0A", 
        primaryText: "#FFFFFF", 
        secondaryText: "#CCCCCC" 
      },
      selectedBox: { 
        headerBg: "#10B981", 
        headerPrimaryText: "#FFFFFF", 
        headerSecondaryText: "#CCCCCC", 
        bg: "#0A0A0A", 
        primaryText: "#FFFFFF", 
        secondaryText: "#CCCCCC" 
      },
      button: { 
        background: "#10B981", 
        text: "#FFFFFF" 
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
      },
      creditCardFields: { 
        textColor: '#000000', 
        placeholderColor: '#999999', 
        borderColor: '#E5E7EB', 
        backgroundColor: '#F9FAFB', 
        focusBorderColor: '#10B981', 
        focusTextColor: '#000000' 
      },
    },
  },
  topComponents: [],
  bottomComponents: [],
};
