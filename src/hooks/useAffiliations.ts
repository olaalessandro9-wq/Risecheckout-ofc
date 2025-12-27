/**
 * useAffiliations - Hook para gerenciar afiliações do usuário
 * 
 * Responsabilidades:
 * - Fetch das afiliações do usuário logado
 * - Cancelamento de afiliação
 * - Gerenciamento de estados de loading/error
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Affiliation {
  id: string;
  commission_rate: number;
  status: string;
  created_at: string;
  product: {
    id: string;
    name: string;
  };
}

interface UseAffiliationsResult {
  affiliations: Affiliation[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  cancelAffiliation: (id: string) => Promise<boolean>;
}

export function useAffiliations(): UseAffiliationsResult {
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAffiliations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAffiliations([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("affiliates")
        .select(`
          id,
          commission_rate,
          status,
          created_at,
          product:products (
            id,
            name
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setAffiliations(data as Affiliation[]);
    } catch (err) {
      console.error("Erro ao buscar afiliações:", err);
      setError("Erro ao carregar suas afiliações.");
      toast.error("Erro ao carregar suas afiliações.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelAffiliation = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from("affiliates")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (updateError) throw updateError;

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
