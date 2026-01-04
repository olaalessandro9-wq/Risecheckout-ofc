/**
 * MembersAreaHeader - Card de toggle da área de membros
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users, ExternalLink } from "lucide-react";

interface MembersAreaHeaderProps {
  enabled: boolean;
  isSaving: boolean;
  onToggle: (enabled: boolean) => void;
}

export function MembersAreaHeader({ enabled, isSaving, onToggle }: MembersAreaHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Área de Membros</CardTitle>
              <CardDescription>
                Crie conteúdos exclusivos para seus compradores
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="members-enabled" className="text-sm">
              {enabled ? "Ativada" : "Desativada"}
            </Label>
            <Switch
              id="members-enabled"
              checked={enabled}
              onCheckedChange={onToggle}
              disabled={isSaving}
            />
          </div>
        </div>
      </CardHeader>
      {enabled && (
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Link de acesso para compradores:
            </span>
            <code className="text-sm bg-background px-2 py-1 rounded border">
              /minha-conta
            </code>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
