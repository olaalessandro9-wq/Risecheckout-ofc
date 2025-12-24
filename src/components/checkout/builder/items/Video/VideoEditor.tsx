import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComponentData } from "../../types";

interface VideoEditorProps {
  component: ComponentData;
  onChange: (newContent: any) => void;
  design?: any;
}

export const VideoEditor = ({ component, onChange }: VideoEditorProps) => {
  const content = component.content || {};

  const handleChange = (field: string, value: any) => {
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
          onValueChange={(value) => handleChange("videoType", value)}
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
