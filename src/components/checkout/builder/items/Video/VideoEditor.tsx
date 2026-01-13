import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComponentData } from "../../types";
import type { VideoContent } from "@/types/checkout-components.types";
import type { CheckoutDesign } from "@/types/checkoutEditor";

interface VideoEditorProps {
  component: ComponentData;
  onChange: (newContent: Partial<VideoContent>) => void;
  design?: CheckoutDesign;
}

export const VideoEditor = ({ component, onChange }: VideoEditorProps) => {
  // Type assertion segura - o componente só recebe content do tipo correto via registry
  const content = (component.content || {}) as VideoContent;

  const handleChange = <K extends keyof VideoContent>(field: K, value: VideoContent[K]) => {
    onChange({
      ...content,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Tipo de Vídeo */}
      <div>
        <Label>Tipo de Vídeo</Label>
        <Select
          value={content.videoType || "youtube"}
          onValueChange={(value) => handleChange("videoType", value as VideoContent["videoType"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="vimeo">Vimeo</SelectItem>
            <SelectItem value="custom">URL Customizada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* URL do Vídeo */}
      <div>
        <Label>URL do Vídeo</Label>
        <Input
          value={content.videoUrl || ""}
          onChange={(e) => handleChange("videoUrl", e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>
    </div>
  );
};
