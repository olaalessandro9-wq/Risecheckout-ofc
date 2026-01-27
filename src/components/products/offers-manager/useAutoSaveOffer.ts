/**
 * useAutoSaveOffer - Auto-save hook for existing offers
 * 
 * RISE ARCHITECT PROTOCOL V3 - Hook isolado para auto-save
 * 
 * Features:
 * - Debounce de 1 segundo antes de salvar
 * - Ignora ofertas temporárias (temp-xxx)
 * - Validação antes de salvar
 * - Feedback visual via estados
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { createLogger } from "@/lib/logger";

const log = createLogger("useAutoSaveOffer");

interface UseAutoSaveOfferProps {
  offerId: string;
  currentName: string;
  currentPrice: number;
  currentMemberGroupId?: string | null;
  debounceMs?: number;
  onSaveSuccess?: () => void;
}

interface AutoSaveState {
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveError: string | null;
  showSavedIndicator: boolean;
}

interface UpdateOfferResponse {
  success: boolean;
  error?: string;
}

export function useAutoSaveOffer({
  offerId,
  currentName,
  currentPrice,
  currentMemberGroupId,
  debounceMs = 500, // OTIMIZAÇÃO: Reduzido de 1000ms para 500ms (UX mais responsiva)
  onSaveSuccess,
}: UseAutoSaveOfferProps): AutoSaveState {
  const { toast } = useToast();
  
  // Estados
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  
  // Refs para controlar debounce e valores commitados
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedIndicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committedValuesRef = useRef({
    name: currentName,
    price: currentPrice,
    memberGroupId: currentMemberGroupId,
  });
  const isFirstRenderRef = useRef(true);

  // Verifica se é oferta temporária
  const isTemporary = offerId.startsWith("temp-");

  // Função de save
  const saveOffer = useCallback(async () => {
    // Não salva ofertas temporárias
    if (isTemporary) return;

    // Validação básica
    const trimmedName = currentName.trim();
    if (!trimmedName) {
      log.warn("Auto-save skipped: empty name");
      return;
    }
    if (currentPrice < 1) {
      log.warn("Auto-save skipped: price too low");
      return;
    }

    // Verifica se realmente mudou
    const committed = committedValuesRef.current;
    if (
      committed.name === trimmedName &&
      committed.price === currentPrice &&
      committed.memberGroupId === currentMemberGroupId
    ) {
      log.info("Auto-save skipped: no changes");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const { data, error } = await api.call<UpdateOfferResponse>("offer-crud", {
        action: "update",
        offer_id: offerId,
        name: trimmedName,
        price: currentPrice,
        member_group_id: currentMemberGroupId || null,
      });

      if (error || !data?.success) {
        const errorMsg = error?.message || data?.error || "Erro ao salvar oferta";
        setSaveError(errorMsg);
        toast({
          variant: "destructive",
          title: "Erro ao salvar",
          description: errorMsg,
        });
        log.error("Auto-save failed:", errorMsg);
        return;
      }

      // Sucesso - atualiza valores commitados
      committedValuesRef.current = {
        name: trimmedName,
        price: currentPrice,
        memberGroupId: currentMemberGroupId,
      };
      
      setLastSavedAt(new Date());
      setShowSavedIndicator(true);
      
      // Esconde indicador após 3 segundos
      if (savedIndicatorTimerRef.current) {
        clearTimeout(savedIndicatorTimerRef.current);
      }
      savedIndicatorTimerRef.current = setTimeout(() => {
        setShowSavedIndicator(false);
      }, 3000);

      log.info(`Auto-saved offer ${offerId}`);
      onSaveSuccess?.();

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      setSaveError(errorMsg);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: errorMsg,
      });
      log.error("Auto-save exception:", errorMsg);
    } finally {
      setIsSaving(false);
    }
  }, [offerId, currentName, currentPrice, currentMemberGroupId, isTemporary, toast, onSaveSuccess]);

  // Effect para detectar mudanças e iniciar debounce
  useEffect(() => {
    // Ignora primeiro render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    // Não faz nada para ofertas temporárias
    if (isTemporary) return;

    // Cancela debounce anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Inicia novo debounce
    debounceTimerRef.current = setTimeout(() => {
      saveOffer();
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentName, currentPrice, currentMemberGroupId, debounceMs, isTemporary, saveOffer]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (savedIndicatorTimerRef.current) clearTimeout(savedIndicatorTimerRef.current);
    };
  }, []);

  return {
    isSaving,
    lastSavedAt,
    saveError,
    showSavedIndicator,
  };
}
