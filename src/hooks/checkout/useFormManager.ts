/**
 * Hook: useFormManager
 * 
 * Responsabilidade Única: Gerenciar o estado do formulário de dados pessoais,
 * validações, cupons e order bumps.
 * 
 * @version 3.0.0 - RISE Protocol V3 - Zero console.log
 * 
 * ✅ REFATORADO (RISE ARCHITECT PROTOCOL):
 * - Usa validators do domain (Single Source of Truth)
 * - Aceita snapshot override para resolver autofill
 * - Não faz toast (UI decide como exibir erros)
 * 
 * ✅ FIX CRÍTICO (Dezembro 2024):
 * - localStorage NUNCA é lido/escrito se checkoutId estiver ausente
 * - Hydration ocorre apenas quando checkoutId chega pela primeira vez
 * - Elimina contaminação de dados entre checkouts diferentes
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { CheckoutFormData, CheckoutFormErrors, OrderBump } from "@/types/checkout";
import { createLogger } from "@/lib/logger";

const log = createLogger("FormManager");
import {
  validatePersonalData,
  parseRequiredFields,
  type PersonalData,
  type RequiredFieldsConfig,
  type ValidationResult,
} from "@/features/checkout/personal-data";

// ============================================================================
// INTERFACE DO HOOK
// ============================================================================

interface UseFormManagerProps {
  checkoutId?: string | null;
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
const getStorageKey = (checkoutId: string) => {
  return `risecheckout_form_data:${checkoutId}`;
};

const EXPIRATION_DAYS = 7; // 1 semana (LGPD compliance)

// ============================================================================
// HELPER: Carregar dados do localStorage
// ============================================================================

function loadFromStorage(storageKey: string): CheckoutFormData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    
    // 🔒 SEGURANÇA: Verificar expiração (7 dias)
    if (parsed.timestamp) {
      const now = Date.now();
      const expirationTime = EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
      if ((now - parsed.timestamp) > expirationTime) {
        log.debug("Dados expirados, removendo...");
        localStorage.removeItem(storageKey);
        return null;
      }
    }
    
    // 🔒 SEGURANÇA: Remover CPF/document do localStorage (LGPD)
    const { document: _, cpf: __, ...safeData } = parsed.data || parsed;
    return {
      ...createEmptyFormData(),
      ...safeData,
      document: "", // Não carregar CPF do localStorage
      cpf: "",      // Não carregar CPF do localStorage
    };
  } catch (e) {
    console.warn("[useFormManager] Erro ao carregar dados do localStorage:", e);
    return null;
  }
}

// ============================================================================
// HELPER: Salvar dados no localStorage
// ============================================================================

function saveToStorage(storageKey: string, formData: CheckoutFormData): void {
  if (typeof window === 'undefined') return;
  
  try {
    // 🔒 SEGURANÇA: Não salvar CPF/document (LGPD)
    const { document: _, cpf: __, ...safeData } = formData;
    
    const dataToSave = {
      data: safeData,
      timestamp: Date.now()
    };
    
    log.trace("Salvando no localStorage:", {
      storageKey,
      name: safeData.name,
      email: safeData.email,
      phone: safeData.phone,
    });
    
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  } catch (e) {
    console.warn("[useFormManager] Erro ao salvar dados no localStorage:", e);
  }
}

// ============================================================================
// HOOK
// ============================================================================

export function useFormManager({
  checkoutId,
  requiredFields,
  orderBumps = [],
  productPrice,
}: UseFormManagerProps): UseFormManagerReturn {
  // Converter requiredFields para RequiredFieldsConfig tipado
  const requiredFieldsConfig = parseRequiredFields(requiredFields);

  // ✅ FIX: Inicializa SEMPRE vazio - hydration vem depois
  const [formData, setFormData] = useState<CheckoutFormData>(createEmptyFormData);
  const [formErrors, setFormErrors] = useState<CheckoutFormErrors>({});
  const [selectedBumps, setSelectedBumps] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ FIX: Track se já hidratamos para este checkoutId (evita hydrate múltiplo)
  const hydratedCheckoutIdRef = useRef<string | null>(null);

  // ✅ FIX: Hydration quando checkoutId chega pela primeira vez
  useEffect(() => {
    // Só hidrata se:
    // 1. Temos checkoutId válido
    // 2. Ainda não hidratamos para este checkoutId
    if (!checkoutId) return;
    if (hydratedCheckoutIdRef.current === checkoutId) return;

    const storageKey = getStorageKey(checkoutId);
    const savedData = loadFromStorage(storageKey);
    
    if (savedData) {
      log.trace("Hidratando do localStorage:", {
        checkoutId,
        name: savedData.name,
        email: savedData.email,
        phone: savedData.phone,
      });
      setFormData(savedData);
    } else {
      log.trace("Sem dados salvos para:", checkoutId);
    }

    // Marca como hidratado para este checkoutId
    hydratedCheckoutIdRef.current = checkoutId;
  }, [checkoutId]);

  // ✅ FIX: Salvar no localStorage SOMENTE se temos checkoutId
  useEffect(() => {
    // Sem checkoutId = sem persistência (evita chave global contaminada)
    if (!checkoutId) return;
    
    // Só salva após a hidratação inicial (evita sobrescrever com dados vazios)
    if (hydratedCheckoutIdRef.current !== checkoutId) return;

    const storageKey = getStorageKey(checkoutId);
    saveToStorage(storageKey, formData);
  }, [formData, checkoutId]);

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
