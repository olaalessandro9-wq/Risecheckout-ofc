/**
 * Hook: useFormManager
 * 
 * Responsabilidade Única: Gerenciar o estado do formulário de dados pessoais,
 * validações, cupons e order bumps.
 * 
 * ✅ REFATORADO (RISE ARCHITECT PROTOCOL):
 * - Usa validators do domain (Single Source of Truth)
 * - Aceita snapshot override para resolver autofill
 * - Não faz toast (UI decide como exibir erros)
 */

import { useState, useCallback, useEffect } from "react";
import type { CheckoutFormData, CheckoutFormErrors, OrderBump } from "@/types/checkout";
import {
  validatePersonalData,
  parseRequiredFields,
  type PersonalData,
  type PersonalDataErrors,
  type RequiredFieldsConfig,
  type ValidationResult,
} from "@/features/checkout/personal-data";

// ============================================================================
// INTERFACE DO HOOK
// ============================================================================

interface UseFormManagerProps {
  checkoutId?: string | null; // ✅ NOVO: Para isolar localStorage por checkout
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
  updateMultipleFields: (fields: Partial<CheckoutFormData>) => void;
  toggleBump: (bumpId: string) => void;
  calculateTotal: () => number;
  validateForm: (snapshotOverride?: Partial<PersonalData>) => ValidationResult;
  setFormErrors: (errors: CheckoutFormErrors) => void;
  clearErrors: () => void;
  setProcessing: (value: boolean) => void;
  getRequiredFieldsConfig: () => RequiredFieldsConfig;
}

// ✅ FIX: Função para gerar chave de storage isolada por checkout
const getStorageKey = (checkoutId?: string | null) => {
  const base = "risecheckout_form_data";
  return checkoutId ? `${base}:${checkoutId}` : base;
};

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
  checkoutId,
  requiredFields,
  orderBumps = [],
  productPrice,
}: UseFormManagerProps): UseFormManagerReturn {
  // Converter requiredFields para RequiredFieldsConfig tipado
  const requiredFieldsConfig = parseRequiredFields(requiredFields);

  // ✅ FIX: Storage key isolada por checkout
  const storageKey = getStorageKey(checkoutId);

  // Estado do formulário com inicialização lazy do localStorage
  const [formData, setFormData] = useState<CheckoutFormData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          
          // 🔒 SEGURANÇA: Verificar expiração (7 dias)
          if (parsed.timestamp) {
            const now = Date.now();
            const expirationTime = EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
            if ((now - parsed.timestamp) > expirationTime) {
              console.log('[useFormManager] Dados expirados, removendo...');
              localStorage.removeItem(storageKey);
              return createEmptyFormData();
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
    return createEmptyFormData();
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
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      } catch (e) {
        console.warn("Erro ao salvar dados no localStorage:", e);
      }
    }
  }, [formData, storageKey]);

  // Atualizar campo do formulário
  const updateField = useCallback((field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    setFormErrors((prev) => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  // Atualizar múltiplos campos de uma vez (para sincronizar com DOM snapshot)
  const updateMultipleFields = useCallback((fields: Partial<CheckoutFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  }, []);

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

  // Limpar todos os erros
  const clearErrors = useCallback(() => {
    setFormErrors({});
  }, []);

  // Retornar config de campos obrigatórios
  const getRequiredFieldsConfig = useCallback(() => {
    return requiredFieldsConfig;
  }, [requiredFieldsConfig]);

  // Validar formulário usando domain validators
  // Aceita snapshot override para resolver problema de autofill
  const validateForm = useCallback((snapshotOverride?: Partial<PersonalData>): ValidationResult => {
    // Mescla estado com snapshot (se fornecido)
    const dataToValidate: PersonalData = {
      name: snapshotOverride?.name ?? formData.name ?? '',
      email: snapshotOverride?.email ?? formData.email ?? '',
      cpf: snapshotOverride?.cpf ?? formData.cpf ?? '',
      phone: snapshotOverride?.phone ?? formData.phone ?? '',
    };

    // Usa validator do domain (Single Source of Truth)
    const result = validatePersonalData(dataToValidate, requiredFieldsConfig);

    // Atualiza estado de erros
    setFormErrors(result.errors as CheckoutFormErrors);

    return result;
  }, [formData, requiredFieldsConfig]);

  return {
    formData,
    formErrors,
    selectedBumps,
    isProcessing,
    updateField,
    updateMultipleFields,
    toggleBump,
    calculateTotal,
    validateForm,
    setFormErrors,
    clearErrors,
    setProcessing: setIsProcessing,
    getRequiredFieldsConfig,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function createEmptyFormData(): CheckoutFormData {
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
