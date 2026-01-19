/**
 * useAffiliations - Hook para gerenciar afiliações do usuário
 * 
 * Responsabilidades:
 * - Fetch das afiliações do usuário logado via Edge Function
 * - Cancelamento de afiliação
 * - Gerenciamento de estados de loading/error
 * 
 * MIGRATED: Usa Edge Function para bypass de RLS
 * (sistema usa autenticação customizada via producer_sessions)
 */

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getProducerSessionToken } from "@/hooks/useProducerAuth";
import { createLogger } from "@/lib/logger";

const log = createLogger("Affiliations");

export interface Affiliation {
  id: string;
  commission_rate: number;
  status: string;
  created_at: string;
  affiliate_code?: string;
  product: {
    id: string;
    name: string;
  } | null;
}

interface UseAffiliationsResult {
  affiliations: Affiliation[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  cancelAffiliation: (id: string) => Promise<boolean>;
}

export function useAffiliations(): UseAffiliationsResult {
  const { user } = useAuth();
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAffiliations = useCallback(async () => {
    const sessionToken = getProducerSessionToken();

    if (!sessionToken || !user?.id) {
      setAffiliations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      log.debug("Buscando afiliações via Edge Function");

      const { data, error: invokeError } = await api.call<{
        error?: string;
        affiliations?: Affiliation[];
      }>("get-my-affiliations", {});

      if (invokeError) {
        log.error("Erro na Edge Function", invokeError);
        throw invokeError;
      }

      if (data?.error) {
        log.error("Erro retornado", { error: data.error });
        throw new Error(data.error);
      }

      const fetchedAffiliations = data?.affiliations || [];
      log.info(`${fetchedAffiliations.length} afiliações encontradas`);

      setAffiliations(fetchedAffiliations);
    } catch (err) {
      log.error("Erro ao buscar afiliações:", err);
      setError("Erro ao carregar suas afiliações.");
      toast.error("Erro ao carregar suas afiliações.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const cancelAffiliation = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Usar Edge Function segura (não UPDATE direto via RLS)
      const { data, error: invokeError } = await api.call<{ error?: string }>(
        "update-affiliate-settings",
        {
          action: "cancel_affiliation",
          affiliate_id: id,
        }
      );

      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);

      // Atualizar estado local
      setAffiliations(prev =>
        prev.map(aff =>
          aff.id === id ? { ...aff, status: "cancelled" } : aff
        )
      );

      toast.success("Afiliação cancelada com sucesso.");
      return true;
    } catch (err) {
      log.error("Erro ao cancelar afiliação:", err);
      toast.error("Erro ao cancelar afiliação.");
      return false;
    }
  }, []);

  useEffect(() => {
    fetchAffiliations();
  }, [fetchAffiliations]);

  return {
    affiliations,
    isLoading,
    error,
    refetch: fetchAffiliations,
    cancelAffiliation,
  };
}
