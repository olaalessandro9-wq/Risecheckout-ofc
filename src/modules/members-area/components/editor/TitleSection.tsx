/**
 * TitleSection - Simple title input for content
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TitleSectionProps {
  title: string;
  onTitleChange: (value: string) => void;
}

export function TitleSection({ title, onTitleChange }: TitleSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="content-title" className="text-sm font-medium">
        Título <span className="text-destructive">*</span>
      </Label>
      <Input
        id="content-title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Ex: Aula 1 - Introdução ao curso"
        className="w-full"
      />
    </div>
  );
}
