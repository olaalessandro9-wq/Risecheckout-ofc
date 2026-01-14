/**
 * Video Editor - Editor de Componente Vídeo
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EditorComponentProps, VideoContent } from "../types";

export function VideoEditor({ content, handleChange }: EditorComponentProps<VideoContent>) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tipo de Vídeo</Label>
        <Select 
          value={content?.videoType || "youtube"}
          onValueChange={(value) => handleChange("videoType", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="vimeo">Vimeo</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
            <SelectItem value="other">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>URL do Vídeo</Label>
        <Input 
          value={content?.videoUrl || ""} 
          onChange={(e) => handleChange("videoUrl", e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>
    </div>
  );
}
