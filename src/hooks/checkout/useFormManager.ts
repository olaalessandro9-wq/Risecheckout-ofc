/**
 * Hook: useFormManager
 * 
 * Responsabilidade Única: Gerenciar o estado do formulário de dados pessoais,
 * validações, cupons e order bumps.
 * 
 * Este hook substitui e simplifica a lógica de useCheckoutLogic.ts.
 */

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { CheckoutFormData, CheckoutFormErrors, OrderBump } from "@/types/checkout";

// ============================================================================
// INTERFACE DO HOOK
// ============================================================================

interface UseFormManagerProps {
  requiredFields: string[];
  orderBumps: OrderBump[];
  productPrice: number;
}

interface UseFormManagerReturn {
  formData: CheckoutFormData;
  formErrors: CheckoutFormErrors;
  selectedBumps: Set<string>;
  isProcessing: boolean;
  updateField: (field: keyof CheckoutFormData, value: string) => void;
  toggleBump: (bumpId: string) => void;
  calculateTotal: () => number;
  validateForm: () => boolean;
  setProcessing: (value: boolean) => void;
}

// Chave para localStorage
const STORAGE_KEY = "risecheckout_form_data";
const EXPIRATION_DAYS = 7; // 1 semana (LGPD compliance)

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para gerenciar o formulário de checkout.
 * 
 * @param props - Configurações do formulário
 * @returns Estado e funções para gerenciar o formulário
 * 
 * @example
 * const { formData, formErrors, updateField, validateForm } = useFormManager({
 *   requiredFields: ['name', 'email', 'phone'],
 *   orderBumps: [],
 *   productPrice: 100
 * });
 */
export function useFormManager({
  requiredFields,
  orderBumps = [],
  productPrice,
}: UseFormManagerProps): UseFormManagerReturn {
  // Estado do formulário com inicialização lazy do localStorage
  const [formData, setFormData] = useState<CheckoutFormData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          
          // 🔒 SEGURANÇA: Verificar expiração (7 dias)
          if (parsed.timestamp) {
            const now = Date.now();
            const expirationTime = EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
            if ((now - parsed.timestamp) > expirationTime) {
              console.log('[useFormManager] Dados expirados, removendo...');
              localStorage.removeItem(STORAGE_KEY);
              return {
                name: "",
                email: "",
                phone: "",
                document: "",
                cpf: "",
                address: "",
                city: "",
                state: "",
                zipcode: "",
              };
            }
          }
          
          // 🔒 SEGURANÇA: Remover CPF/document do localStorage (LGPD)
          const { document: _, cpf: __, ...safeData } = parsed.data || parsed;
          return {
            ...safeData,
            document: "", // Não carregar CPF do localStorage
            cpf: "",      // Não carregar CPF do localStorage
          };
        }
      } catch (e) {
        console.warn("Erro ao carregar dados do localStorage:", e);
      }
    }
    return {
      name: "",
      email: "",
      phone: "",
      document: "",
      cpf: "",
      address: "",
      city: "",
      state: "",
      zipcode: "",
    };
  });

  const [formErrors, setFormErrors] = useState<CheckoutFormErrors>({});
  const [selectedBumps, setSelectedBumps] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Salvar no localStorage sempre que formData mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // 🔒 SEGURANÇA: Não salvar CPF/document (LGPD)
        const { document: _, cpf: __, ...safeData } = formData;
        
        const dataToSave = {
          data: safeData,
          timestamp: Date.now()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (e) {
        console.warn("Erro ao salvar dados no localStorage:", e);
      }
    }
  }, [formData]);

  // Atualizar campo do formulário
  const updateField = useCallback((field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [formErrors]);

  // Alternar seleção de order bump
  const toggleBump = useCallback((bumpId: string) => {
    setSelectedBumps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(bumpId)) {
        newSet.delete(bumpId);
      } else {
        newSet.add(bumpId);
      }
      return newSet;
    });
  }, []);

  // Calcular total com order bumps
  const calculateTotal = useCallback((): number => {
    let total = productPrice;
    
    selectedBumps.forEach((bumpId) => {
      const bump = orderBumps.find((b) => b.id === bumpId);
      if (bump) {
        total += bump.price;
      }
    });
    
    return total;
  }, [productPrice, orderBumps, selectedBumps]);

  // Validar formulário
  const validateForm = useCallback((): boolean => {
    const errors: CheckoutFormErrors = {};

    // Validar campos obrigatórios
    requiredFields.forEach((field) => {
      const value = formData[field as keyof CheckoutFormData];
      if (!value || value.trim() === "") {
        errors[field as keyof CheckoutFormErrors] = "Campo obrigatório";
      }
    });

    // Validar email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email inválido";
    }

    // Validar telefone (mínimo 10 dígitos)
    if (formData.phone && formData.phone.replace(/\D/g, "").length < 10) {
      errors.phone = "Telefone inválido";
    }

    // Validar CPF (11 dígitos)
    if (formData.cpf && formData.cpf.replace(/\D/g, "").length !== 11) {
      errors.cpf = "CPF inválido";
    }

    setFormErrors(errors);

    // Mostrar toast se houver erros
    if (Object.keys(errors).length > 0) {
      toast.error("Por favor, preencha todos os campos obrigatórios corretamente");
      return false;
    }

    return true;
  }, [formData, requiredFields]);

  return {
    formData,
    formErrors,
    selectedBumps,
    isProcessing,
    updateField,
    toggleBump,
    calculateTotal,
    validateForm,
    setProcessing: setIsProcessing,
  };
}
