/**
 * DripContentSection - Section for configuring content release (drip) settings
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, CheckCircle2, Zap } from "lucide-react";
import type { ReleaseType, DripFormData, MemberContent } from "../../types";

interface DripContentSectionProps {
  settings: DripFormData;
  availableContents: MemberContent[];
  currentContentId?: string;
  onSettingsChange: (settings: DripFormData) => void;
}

const RELEASE_OPTIONS: { value: ReleaseType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "immediate",
    label: "Imediato",
    description: "Disponível assim que o aluno tiver acesso",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    value: "days_after_purchase",
    label: "Dias após a compra",
    description: "Liberado X dias após a data de compra",
    icon: <Clock className="h-5 w-5" />,
  },
  {
    value: "fixed_date",
    label: "Data fixa",
    description: "Liberado em uma data específica",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    value: "after_content",
    label: "Após completar conteúdo",
    description: "Liberado quando outro conteúdo for concluído",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
];

export function DripContentSection({
  settings,
  availableContents,
  currentContentId,
  onSettingsChange,
}: DripContentSectionProps) {
  const handleReleaseTypeChange = (value: ReleaseType) => {
    onSettingsChange({
      ...settings,
      release_type: value,
    });
  };

  const handleDaysChange = (value: string) => {
    const days = parseInt(value, 10);
    onSettingsChange({
      ...settings,
      days_after_purchase: isNaN(days) ? null : days,
    });
  };

  const handleDateChange = (value: string) => {
    onSettingsChange({
      ...settings,
      fixed_date: value || null,
    });
  };

  const handleAfterContentChange = (value: string) => {
    onSettingsChange({
      ...settings,
      after_content_id: value || null,
    });
  };

  // Filter out current content from available contents for "after_content" option
  const selectableContents = availableContents.filter(
    (content) => content.id !== currentContentId
  );

  return (
    <div className="space-y-6 rounded-lg border bg-card p-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Liberação</h3>
        <p className="text-sm text-muted-foreground">
          Configure quando este conteúdo será liberado para os alunos
        </p>
      </div>

      <RadioGroup
        value={settings.release_type}
        onValueChange={(v) => handleReleaseTypeChange(v as ReleaseType)}
        className="space-y-4"
      >
        {RELEASE_OPTIONS.map(({ value, label, description, icon }) => (
          <div key={value} className="flex items-start space-x-4">
            <RadioGroupItem value={value} id={`release-${value}`} className="mt-1" />
            <div className="flex-1 space-y-2">
              <Label
                htmlFor={`release-${value}`}
                className="flex items-center gap-2 cursor-pointer font-medium"
              >
                {icon}
                {label}
              </Label>
              <p className="text-sm text-muted-foreground">{description}</p>

              {/* Days input */}
              {value === "days_after_purchase" && settings.release_type === "days_after_purchase" && (
                <div className="flex items-center gap-2 pt-2">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={settings.days_after_purchase || ""}
                    onChange={(e) => handleDaysChange(e.target.value)}
                    placeholder="7"
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">dias após a compra</span>
                </div>
              )}

              {/* Date input */}
              {value === "fixed_date" && settings.release_type === "fixed_date" && (
                <div className="pt-2">
                  <Input
                    type="date"
                    value={settings.fixed_date?.split("T")[0] || ""}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-48"
                  />
                </div>
              )}

              {/* After content select */}
              {value === "after_content" && settings.release_type === "after_content" && (
                <div className="pt-2">
                  <Select
                    value={settings.after_content_id || ""}
                    onValueChange={handleAfterContentChange}
                  >
                    <SelectTrigger className="w-80">
                      <SelectValue placeholder="Selecione o conteúdo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableContents.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Nenhum conteúdo disponível
                        </SelectItem>
                      ) : (
                        selectableContents.map((content) => (
                          <SelectItem key={content.id} value={content.id}>
                            {content.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
