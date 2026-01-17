/**
 * useGeneralTabForm - Estado e Validação do Formulário
 * 
 * @see RISE ARCHITECT PROTOCOL
 * 
 * FIXES:
 * - Added isInitialized flag to prevent false positive hasChanges
 * - Form only marks as "initialized" after product data is loaded
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { GeneralFormData, GeneralFormErrors } from "../types";

interface Product {
  name: string;
  description?: string | null;
  price: number;
  support_name?: string | null;
  support_email?: string | null;
  delivery_url?: string | null;
  external_delivery?: boolean | null;
}

interface UseGeneralTabFormProps {
  product: Product | null;
}

export function useGeneralTabForm({ product }: UseGeneralTabFormProps) {
  const [form, setForm] = useState<GeneralFormData>({
    name: "",
    description: "",
    price: 0,
    support_name: "",
    support_email: "",
    delivery_url: "",
    external_delivery: false,
  });

  const [errors, setErrors] = useState<GeneralFormErrors>({
    name: "",
    description: "",
    price: "",
    support_name: "",
    support_email: "",
    delivery_url: "",
  });

  // Track if form has been initialized with product data
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Store reference to the product data that initialized the form
  const initialProductRef = useRef<Product | null>(null);

  // Sincronizar form com product
  useEffect(() => {
    if (product) {
      const normalizedForm: GeneralFormData = {
        name: product.name,
        description: product.description || "",
        price: product.price,
        support_name: product.support_name || "",
        support_email: product.support_email || "",
        delivery_url: product.delivery_url || "",
        external_delivery: product.external_delivery ?? false,
      };
      
      setForm(normalizedForm);
      initialProductRef.current = product;
      
      // Mark as initialized after setting form from product
      // Use requestAnimationFrame to ensure state update happens after render
      requestAnimationFrame(() => {
        setIsInitialized(true);
      });
    }
  }, [product]);

  // Reset initialization when product id changes (different product)
  useEffect(() => {
    if (product && initialProductRef.current && product.name !== initialProductRef.current.name) {
      setIsInitialized(false);
    }
  }, [product]);

  const validate = useCallback((): boolean => {
    const newErrors: GeneralFormErrors = {
      name: "",
      description: "",
      price: "",
      support_name: "",
      support_email: "",
      delivery_url: "",
    };
    let valid = true;

    if (!form.name.trim()) {
      newErrors.name = "Nome do produto é obrigatório";
      valid = false;
    }

    if (form.description.trim().length < 100) {
      newErrors.description = "A descrição deve ter no mínimo 100 caracteres";
      valid = false;
    }

    if (!form.price || form.price <= 0) {
      newErrors.price = "Preço deve ser maior que zero";
      valid = false;
    }

    if (!form.support_name.trim()) {
      newErrors.support_name = "Nome de exibição é obrigatório";
      valid = false;
    }

    if (!form.support_email.trim()) {
      newErrors.support_email = "E-mail de suporte é obrigatório";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.support_email)) {
      newErrors.support_email = "E-mail inválido";
      valid = false;
    }

    if (form.delivery_url && !form.delivery_url.startsWith("https://")) {
      newErrors.delivery_url = "O link deve começar com https://";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }, [form]);

  const clearError = useCallback((field: keyof GeneralFormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  return {
    form,
    setForm,
    errors,
    validate,
    clearError,
    isInitialized,
  };
}
