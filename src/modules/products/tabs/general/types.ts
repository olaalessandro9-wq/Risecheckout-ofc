/**
 * Tipos compartilhados para GeneralTab
 */

export interface GeneralFormData {
  name: string;
  description: string;
  price: number;
  support_name: string;
  support_email: string;
}

export interface GeneralFormErrors {
  name: string;
  description: string;
  price: string;
  support_name: string;
  support_email: string;
}

export interface ImageState {
  imageFile: File | null;
  imageUrl: string;
  pendingRemoval: boolean;
}
