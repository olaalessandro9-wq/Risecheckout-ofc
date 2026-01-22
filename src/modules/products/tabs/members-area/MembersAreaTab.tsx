/**
 * MembersAreaTab - Aba simplificada que redireciona para a seção dedicada
 * 
 * Esta aba mostra apenas:
 * - Toggle para ativar/desativar a área de membros
 * - Botão grande para acessar a seção dedicada de gestão
 */

import { useSearchParams } from "react-router-dom";
import { useProductContext } from "../../context/ProductContext";
import { useMembersArea } from "@/modules/members-area/hooks";
import { Loader2, BookOpen, Users, Video, ArrowRight, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function MembersAreaTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { product: productData } = useProductContext();
  const {
    isLoading,
    isSaving,
    settings,
    modules,
    updateSettings,
  } = useMembersArea(productData?.id);

  const handleToggleEnabled = async (enabled: boolean) => {
    await updateSettings(enabled);
  };

  const handleOpenMembersArea = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("section", "members-area");
    newParams.set("tab", "content");
    setSearchParams(newParams);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalContents = modules.reduce((acc, mod) => acc + (mod.contents?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toggle de Ativação */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Área de Membros
              </CardTitle>
              <CardDescription>
                Entregue conteúdo exclusivo para seus clientes
              </CardDescription>
          </div>
            <div className="flex items-center gap-2">
              {isSaving && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Switch
                id="members-area-enabled"
                checked={settings.enabled}
                onCheckedChange={handleToggleEnabled}
                disabled={isSaving}
              />
              <Label htmlFor="members-area-enabled" className="text-sm min-w-[90px]">
                {isSaving 
                  ? (settings.enabled ? "Desativando..." : "Ativando...") 
                  : (settings.enabled ? "Ativo" : "Inativo")
                }
              </Label>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Card de Acesso à Seção Dedicada */}
      {settings.enabled && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Stats */}
              <div className="flex-1 grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Video className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{modules.length}</p>
                    <p className="text-xs text-muted-foreground">Módulos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalContents}</p>
                    <p className="text-xs text-muted-foreground">Conteúdos</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center md:items-end gap-2">
                <Button 
                  size="lg" 
                  onClick={handleOpenMembersArea}
                  className="gap-2 w-full md:w-auto"
                >
                  <Settings2 className="h-5 w-5" />
                  Gerenciar Área de Membros
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Configure módulos, conteúdos e alunos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dica quando desativado */}
      {!settings.enabled && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold mb-2">Área de Membros Desativada</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Ative a área de membros para criar módulos com aulas, 
              materiais complementares e gerenciar o acesso dos seus alunos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
