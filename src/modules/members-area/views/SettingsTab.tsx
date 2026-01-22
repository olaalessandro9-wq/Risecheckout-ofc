/**
 * SettingsTab - Configurações completas da área de membros
 * 
 * RISE V3: Consumes MembersAreaContext instead of creating hook instances
 */

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMembersAreaContext } from "../context";
import { 
  SettingsThemeSection, 
  SettingsAccessSection, 
  SettingsNotificationsSection,
  parseSettingsFromJson,
  DEFAULT_SETTINGS,
  type MembersAreaSettingsData,
} from "./settings";

export function SettingsTab() {
  // Use unified context - NO duplicate hook instances
  const { membersArea } = useMembersAreaContext();
  const { settings: membersAreaSettings, updateSettings, isSaving } = membersArea;
  
  const [localSettings, setLocalSettings] = useState<MembersAreaSettingsData>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local settings from saved data
  useEffect(() => {
    if (membersAreaSettings.settings) {
      setLocalSettings(parseSettingsFromJson(membersAreaSettings.settings));
      setHasChanges(false);
    }
  }, [membersAreaSettings.settings]);

  const handleChange = useCallback((updates: Partial<MembersAreaSettingsData>) => {
    setLocalSettings(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    try {
      // Cast to Json type for Supabase compatibility
      await updateSettings(membersAreaSettings.enabled, localSettings as unknown as import("@/integrations/supabase/types").Json);
      setHasChanges(false);
      toast.success("Configurações salvas com sucesso!");
    } catch {
      toast.error("Erro ao salvar configurações");
    }
  };

  const handleReset = () => {
    setLocalSettings(parseSettingsFromJson(membersAreaSettings.settings));
    setHasChanges(false);
    toast.info("Alterações descartadas");
  };

  if (!membersAreaSettings.enabled) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-muted p-6 mb-6">
          <Save className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Área de Membros Desativada</h2>
        <p className="text-muted-foreground max-w-md">
          Ative a área de membros na aba principal para acessar as configurações.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Configurações</h2>
          <p className="text-sm text-muted-foreground">
            Personalize a experiência dos seus alunos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="ghost" onClick={handleReset} disabled={isSaving}>
              Descartar
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="gap-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <SettingsThemeSection 
            settings={localSettings} 
            onChange={handleChange}
            disabled={isSaving}
          />
          <SettingsNotificationsSection 
            settings={localSettings} 
            onChange={handleChange}
            disabled={isSaving}
          />
        </div>
        <div>
          <SettingsAccessSection 
            settings={localSettings} 
            onChange={handleChange}
            disabled={isSaving}
          />
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
            <span className="text-sm font-medium">Você tem alterações não salvas</span>
            <Button size="sm" variant="secondary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
