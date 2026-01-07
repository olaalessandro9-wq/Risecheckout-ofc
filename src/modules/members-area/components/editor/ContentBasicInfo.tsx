/**
 * ContentBasicInfo - Section for title and content type selection
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Video, FileText, Type, Download, HelpCircle, Radio } from "lucide-react";
import type { ContentType } from "../../types";

interface ContentBasicInfoProps {
  title: string;
  contentType: ContentType;
  onTitleChange: (value: string) => void;
  onContentTypeChange: (value: ContentType) => void;
}

const CONTENT_TYPES: { value: ContentType; label: string; icon: React.ReactNode }[] = [
  { value: "video", label: "Vídeo", icon: <Video className="h-4 w-4" /> },
  { value: "pdf", label: "PDF", icon: <FileText className="h-4 w-4" /> },
  { value: "text", label: "Texto", icon: <Type className="h-4 w-4" /> },
  { value: "download", label: "Download", icon: <Download className="h-4 w-4" /> },
  { value: "quiz", label: "Quiz", icon: <HelpCircle className="h-4 w-4" /> },
  { value: "live", label: "Live", icon: <Radio className="h-4 w-4" /> },
];

export function ContentBasicInfo({
  title,
  contentType,
  onTitleChange,
  onContentTypeChange,
}: ContentBasicInfoProps) {
  return (
    <div className="space-y-6 rounded-lg border bg-card p-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="content-title">
          Título <span className="text-destructive">*</span>
        </Label>
        <Input
          id="content-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Ex: Aula 1 - Introdução"
          className="max-w-xl"
        />
      </div>

      {/* Content Type */}
      <div className="space-y-3">
        <Label>Tipo de Conteúdo</Label>
        <RadioGroup
          value={contentType}
          onValueChange={(v) => onContentTypeChange(v as ContentType)}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3"
        >
          {CONTENT_TYPES.map(({ value, label, icon }) => (
            <div key={value}>
              <RadioGroupItem
                value={value}
                id={`content-type-${value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`content-type-${value}`}
                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
              >
                {icon}
                <span className="mt-2 text-sm font-medium">{label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
