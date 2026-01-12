/**
 * Componente: PixelCard
 * Card individual para exibir um pixel na biblioteca
 */

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "./PlatformIcon";
import type { VendorPixel } from "./types";
import { PLATFORM_INFO } from "./types";

interface PixelCardProps {
  pixel: VendorPixel;
  onEdit: (pixel: VendorPixel) => void;
  onDelete: (pixel: VendorPixel) => void;
}

export function PixelCard({ pixel, onEdit, onDelete }: PixelCardProps) {
  const platformInfo = PLATFORM_INFO[pixel.platform];
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-muted">
          <PlatformIcon platform={pixel.platform} size={24} />
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{pixel.name}</span>
            <Badge variant={pixel.is_active ? "default" : "secondary"}>
              {pixel.is_active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <span className="font-mono">{pixel.pixel_id}</span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {pixel.linked_products_count !== undefined && (
              <span>
                Vinculado a {pixel.linked_products_count} {pixel.linked_products_count === 1 ? 'produto' : 'produtos'}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(pixel)}
          title="Editar pixel"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(pixel)}
          title="Excluir pixel"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
