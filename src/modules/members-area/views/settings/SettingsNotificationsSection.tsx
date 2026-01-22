/**
 * SettingsNotificationsSection - Configurações de notificações
 */

import { Bell, Mail } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MembersAreaSettingsData } from "./types";

interface SettingsNotificationsSectionProps {
  settings: MembersAreaSettingsData;
  onChange: (updates: Partial<MembersAreaSettingsData>) => void;
  disabled?: boolean;
}

export function SettingsNotificationsSection({ settings, onChange, disabled }: SettingsNotificationsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações
        </CardTitle>
        <CardDescription>
          Configure notificações automáticas para alunos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Welcome Email */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email de Boas-vindas
            </Label>
            <p className="text-xs text-muted-foreground">
              Enviar email quando aluno recebe acesso
            </p>
          </div>
          <Switch
            checked={settings.send_welcome_email}
            onCheckedChange={(checked) => onChange({ send_welcome_email: checked })}
            disabled={disabled}
          />
        </div>

        {/* New Content Notification */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Notificar Novo Conteúdo</Label>
            <p className="text-xs text-muted-foreground">
              Avisar alunos quando novos módulos são liberados
            </p>
          </div>
          <Switch
            checked={settings.notify_new_content}
            onCheckedChange={(checked) => onChange({ notify_new_content: checked })}
            disabled={disabled}
          />
        </div>

        {/* Completion Certificate */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Certificado de Conclusão</Label>
            <p className="text-xs text-muted-foreground">
              Enviar certificado automático ao completar o curso
            </p>
          </div>
          <Switch
            checked={settings.send_completion_certificate}
            onCheckedChange={(checked) => onChange({ send_completion_certificate: checked })}
            disabled={disabled}
          />
        </div>

        {/* Inactivity Reminder */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Lembrete de Inatividade</Label>
            <p className="text-xs text-muted-foreground">
              Enviar lembrete para alunos inativos há mais de 7 dias
            </p>
          </div>
          <Switch
            checked={settings.send_inactivity_reminder}
            onCheckedChange={(checked) => onChange({ send_inactivity_reminder: checked })}
            disabled={disabled}
          />
        </div>

        {/* Progress Milestones */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Marcos de Progresso</Label>
            <p className="text-xs text-muted-foreground">
              Parabenizar aluno em 25%, 50%, 75% e 100% de conclusão
            </p>
          </div>
          <Switch
            checked={settings.notify_progress_milestones}
            onCheckedChange={(checked) => onChange({ notify_progress_milestones: checked })}
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
