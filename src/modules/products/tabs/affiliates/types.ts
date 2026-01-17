/**
 * Affiliates Tab Types
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type { AffiliateSettings } from "../../types/product.types";

export type AffiliateSettingValue = string | number | boolean;

export type OnChangeHandler = (field: keyof AffiliateSettings, value: AffiliateSettingValue) => void;
