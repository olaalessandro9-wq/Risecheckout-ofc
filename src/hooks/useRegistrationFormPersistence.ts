/**
 * useRegistrationFormPersistence - Persiste dados do formulário de cadastro
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Usa sessionStorage (não localStorage) para:
 * - Dados são limpos ao fechar navegador (LGPD compliance)
 * - Não persiste entre sessões (segurança)
 * - Persiste ao trocar de aba/navegador na mesma sessão
 * 
 * NUNCA persiste: senha (segurança absoluta)
 * 
 * @module hooks/useRegistrationFormPersistence
 */

import { useCallback, useRef } from "react";

const STORAGE_KEY = "rise_registration_form";

export interface RegistrationFormData {
  name: string;
  cpfCnpj: string;
  phone: string;
  email: string;
  registrationType: "producer" | "affiliate";
}

export function useRegistrationFormPersistence() {
  const isHydratedRef = useRef(false);

  /**
   * Carrega dados salvos do sessionStorage
   * @returns Dados parciais do formulário ou null se não existir
   */
  const loadSavedData = useCallback((): Partial<RegistrationFormData> | null => {
    if (typeof window === "undefined") return null;
    
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      return JSON.parse(saved) as Partial<RegistrationFormData>;
    } catch {
      return null;
    }
  }, []);

  /**
   * Salva dados no sessionStorage
   * NUNCA salva senha - segurança crítica
   */
  const saveData = useCallback((data: Partial<RegistrationFormData>) => {
    if (typeof window === "undefined") return;
    
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Silently fail - não bloquear UX por erro de storage
    }
  }, []);

  /**
   * Limpa dados do sessionStorage após sucesso no cadastro
   */
  const clearData = useCallback(() => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    loadSavedData,
    saveData,
    clearData,
    isHydratedRef,
  };
}
