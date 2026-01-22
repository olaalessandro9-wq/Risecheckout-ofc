/**
 * Checkout Colors Types
 * 
 * Tipos compartilhados para cores do checkout.
 * RISE V3: SSOT para evitar duplicação de tipos entre themePresets.ts e checkoutEditor.ts
 */

// ============================================================================
// SHARED COLOR TYPES
// ============================================================================

export interface ButtonColors {
  text: string;
  background: string;
  icon: string;
  border?: string;
}

export interface BoxColors {
  headerBg: string;
  headerPrimaryText: string;
  headerSecondaryText: string;
  bg: string;
  primaryText: string;
  secondaryText: string;
}

export interface OrderSummaryColors {
  background: string;
  titleText: string;
  productName: string;
  priceText: string;
  labelText: string;
  borderColor: string;
}

export interface FooterColors {
  background: string;
  primaryText: string;
  secondaryText: string;
  border: string;
}

export interface SecurePurchaseColors {
  headerBackground: string;
  headerText: string;
  cardBackground: string;
  primaryText: string;
  secondaryText: string;
  linkText: string;
}

export interface OrderBumpColors {
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
}

export interface FieldColors {
  textColor: string;
  placeholderColor: string;
  borderColor: string;
  backgroundColor: string;
  focusBorderColor: string;
  focusTextColor: string;
}

export interface InfoBoxColors {
  background: string;
  border: string;
  text: string;
}

// ============================================================================
// MAIN COLORS INTERFACE
// ============================================================================

export interface CheckoutColors {
  background: string;
  primaryText: string;
  secondaryText: string;
  active: string;
  icon: string;
  formBackground: string;
  border: string;
  placeholder?: string;
  inputBackground?: string;
  unselectedButton: ButtonColors;
  selectedButton: ButtonColors;
  box: BoxColors;
  unselectedBox: BoxColors;
  selectedBox: BoxColors;
  button: { background: string; text: string };
  orderSummary: OrderSummaryColors;
  footer: FooterColors;
  securePurchase: SecurePurchaseColors;
  orderBump: OrderBumpColors;
  creditCardFields: FieldColors;
  personalDataFields: FieldColors;
  infoBox: InfoBoxColors;
  productPrice: string;
}
