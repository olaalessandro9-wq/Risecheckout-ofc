/**
 * MarketplaceSettings - Configurações de Marketplace
 * 
 * Componente CONTROLADO para gerenciar a exibição do produto no marketplace público
 * Estado é gerenciado pelo componente pai (AffiliatesTab)
 * 
 * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
 */

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Store, Eye, MousePointerClick, Info } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import type { Database } from "@/integrations/supabase/types";

const log = createLogger("MarketplaceSettings");

type MarketplaceCategory = Database["public"]["Tables"]["marketplace_categories"]["Row"];

interface MarketplaceSettingsProps {
  productId: string;
  affiliateEnabled: boolean;
  // Valores controlados
  showInMarketplace: boolean;
  marketplaceDescription: string;
  marketplaceCategory: string;
  // Callbacks
  onChange: (field: string, value: string | boolean) => void;
}

interface CategoriesResponse {
  success: boolean;
  data?: MarketplaceCategory[];
  error?: string;
}

interface StatsResponse {
  success: boolean;
  data?: {
    marketplace_views?: number;
    marketplace_clicks?: number;
    marketplace_enabled_at?: string | null;
  };
  error?: string;
}

export function MarketplaceSettings({
  productId,
  affiliateEnabled,
  showInMarketplace,
  marketplaceDescription,
  marketplaceCategory,
  onChange,
}: MarketplaceSettingsProps) {
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [stats, setStats] = useState({
    views: 0,
    clicks: 0,
    enabledAt: null as string | null,
  });

  /**
   * Load categories via Edge Function
   * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
   */
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        
        const { data, error } = await api.call<CategoriesResponse>('admin-data', {
          action: 'marketplace-categories',
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Erro ao carregar categorias');
        
        setCategories(data.data || []);
      } catch (error: unknown) {
        log.error("Erro ao carregar categorias:", error);
        toast.error("Erro ao carregar categorias");
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  /**
   * Load stats via Edge Function
   * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
   */
  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data, error } = await api.call<StatsResponse>('admin-data', { 
          action: 'marketplace-stats',
          productId,
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Erro ao carregar estatísticas');

        if (data.data) {
          setStats({
            views: data.data.marketplace_views || 0,
            clicks: data.data.marketplace_clicks || 0,
            enabledAt: data.data.marketplace_enabled_at || null,
          });
        }
      } catch (error: unknown) {
        log.error("Erro ao carregar estatísticas:", error);
      }
    };

    if (productId) {
      loadStats();
    }
  }, [productId]);

  if (isLoadingCategories) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-base font-semibold">Marketplace Público</h3>
        </div>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-base font-semibold">Marketplace Público</h3>
              {showInMarketplace && (
                <Badge variant="default" className="gap-1">
                  <Eye className="w-3 h-3" />
                  Visível
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {affiliateEnabled
                ? "Exiba seu produto no marketplace para que afiliados possam encontrá-lo e promovê-lo"
                : "Ative o programa de afiliados primeiro para usar o marketplace"}
            </p>
          </div>
          <Switch
            id="showInMarketplace"
            checked={showInMarketplace}
            onCheckedChange={(checked) => onChange("showInMarketplace", checked)}
            disabled={!affiliateEnabled}
            className="mt-1"
          />
        </div>

        {/* Aviso se afiliados não estiver ativo */}
        {!affiliateEnabled && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Para exibir seu produto no marketplace, você precisa primeiro
              ativar o programa de afiliados acima.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Configurações do Marketplace */}
      {showInMarketplace && affiliateEnabled && (
        <>
          <Separator />

          {/* Estatísticas */}
          {stats.enabledAt && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.views}</p>
                  <p className="text-xs text-muted-foreground">Visualizações</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <MousePointerClick className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.clicks}</p>
                  <p className="text-xs text-muted-foreground">Cliques</p>
                </div>
              </div>
            </div>
          )}

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="marketplaceDescription">
              Descrição para o Marketplace *
            </Label>
            <Textarea
              id="marketplaceDescription"
              placeholder="Descreva seu produto de forma atrativa para os afiliados..."
              value={marketplaceDescription}
              onChange={(e) => onChange("marketplaceDescription", e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {marketplaceDescription.length}/500 caracteres (mínimo 50)
            </p>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="marketplaceCategory">Categoria *</Label>
            <Select
              value={marketplaceCategory}
              onValueChange={(value) => onChange("marketplaceCategory", value)}
            >
              <SelectTrigger id="marketplaceCategory">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Escolha a categoria que melhor representa seu produto
            </p>
          </div>

        </>
      )}
    </div>
  );
}
