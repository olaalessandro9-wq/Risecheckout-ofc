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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getProducerSessionToken } from "@/hooks/useProducerAuth";

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

      console.log("[useAffiliations] Buscando afiliações via Edge Function...");

      const { data, error: invokeError } = await supabase.functions.invoke(
        "get-my-affiliations",
        {
          headers: {
            "x-producer-session-token": sessionToken,
          },
        }
      );

      if (invokeError) {
        console.error("[useAffiliations] Erro na Edge Function:", invokeError);
        throw invokeError;
      }

      if (data?.error) {
        console.error("[useAffiliations] Erro retornado:", data.error);
        throw new Error(data.error);
      }

      const fetchedAffiliations = data?.affiliations || [];
      console.log(`[useAffiliations] ${fetchedAffiliations.length} afiliações encontradas`);

      setAffiliations(fetchedAffiliations);
    } catch (err) {
      console.error("Erro ao buscar afiliações:", err);
      setError("Erro ao carregar suas afiliações.");
      toast.error("Erro ao carregar suas afiliações.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const cancelAffiliation = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Usar Edge Function segura (não UPDATE direto via RLS)
      const { data, error: invokeError } = await supabase.functions.invoke(
        'update-affiliate-settings',
        {
          body: {
            action: 'cancel_affiliation',
            affiliate_id: id
          }
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
      console.error("Erro ao cancelar afiliação:", err);
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
