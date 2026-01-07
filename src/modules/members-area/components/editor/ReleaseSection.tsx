/**
 * ReleaseSection - Content release/drip settings
 * Complete implementation with all release types including after_content
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Calendar, Zap, CheckCircle2 } from "lucide-react";
import type { ReleaseFormData, ReleaseType, MemberContent } from "../../types";

interface ReleaseSectionProps {
  settings: ReleaseFormData;
  onSettingsChange: (settings: ReleaseFormData) => void;
  /** Available contents for "after_content" selection */
  availableContents?: Pick<MemberContent, "id" | "title">[];
  /** Current content ID to exclude from selection */
  currentContentId?: string;
}

const RELEASE_OPTIONS: { 
  value: ReleaseType; 
  label: string; 
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "immediate",
    label: "Liberação imediata",
    description: "O conteúdo fica disponível assim que o aluno comprar",
    icon: <Zap className="h-5 w-5 text-green-500" />,
  },
  {
    value: "days_after_purchase",
    label: "Por dias",
    description: "Liberar após X dias da compra",
    icon: <Clock className="h-5 w-5 text-blue-500" />,
  },
  {
    value: "fixed_date",
    label: "Por data",
    description: "Liberar em uma data específica",
    icon: <Calendar className="h-5 w-5 text-orange-500" />,
  },
  {
    value: "after_content",
    label: "Após conteúdo",
    description: "Liberar após o aluno concluir outro conteúdo",
    icon: <CheckCircle2 className="h-5 w-5 text-purple-500" />,
  },
];

export function ReleaseSection({ 
  settings, 
  onSettingsChange,
  availableContents = [],
  currentContentId,
}: ReleaseSectionProps) {
  // Filter out current content from selectable options
  const selectableContents = availableContents.filter(c => c.id !== currentContentId);

  const handleReleaseTypeChange = (value: ReleaseType) => {
    onSettingsChange({
      ...settings,
      release_type: value,
      days_after_purchase: value === "days_after_purchase" ? settings.days_after_purchase || 1 : null,
      fixed_date: value === "fixed_date" ? settings.fixed_date : null,
      after_content_id: value === "after_content" ? settings.after_content_id : null,
    });
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || null;
    onSettingsChange({ ...settings, days_after_purchase: value });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, fixed_date: e.target.value || null });
  };

  const handleAfterContentChange = (contentId: string) => {
    onSettingsChange({ ...settings, after_content_id: contentId || null });
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Liberação</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Defina quando este conteúdo será liberado para os alunos
      </p>

      <RadioGroup
        value={settings.release_type}
        onValueChange={(v) => handleReleaseTypeChange(v as ReleaseType)}
        className="space-y-3"
      >
        {RELEASE_OPTIONS.map((option) => (
          <div key={option.value} className="space-y-2">
            <div className="flex items-start gap-3">
              <RadioGroupItem
                value={option.value}
                id={`release-${option.value}`}
                className="mt-1"
              />
              <Label
                htmlFor={`release-${option.value}`}
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </Label>
            </div>

            {/* Conditional inputs */}
            {settings.release_type === "days_after_purchase" && option.value === "days_after_purchase" && (
              <div className="ml-7 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Liberar em</span>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={settings.days_after_purchase || ""}
                    onChange={handleDaysChange}
                    className="w-20"
                    placeholder="7"
                  />
                  <span className="text-sm text-muted-foreground">dias após a compra</span>
                </div>
              </div>
            )}

            {settings.release_type === "fixed_date" && option.value === "fixed_date" && (
              <div className="ml-7 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Liberar em</span>
                  <Input
                    type="date"
                    value={settings.fixed_date || ""}
                    onChange={handleDateChange}
                    className="w-auto"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
            )}

            {settings.release_type === "after_content" && option.value === "after_content" && (
              <div className="ml-7 mt-2">
                {selectableContents.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Liberar após concluir</span>
                    <Select
                      value={settings.after_content_id || ""}
                      onValueChange={handleAfterContentChange}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Selecione um conteúdo" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectableContents.map((content) => (
                          <SelectItem key={content.id} value={content.id}>
                            {content.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Nenhum outro conteúdo disponível no módulo para selecionar como pré-requisito.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
