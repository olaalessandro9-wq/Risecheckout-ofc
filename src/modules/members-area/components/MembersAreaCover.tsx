/**
 * MembersAreaCover - Capa visual customizável da área de membros
 */

import { useState } from "react";
import { Pencil, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MembersAreaCoverProps {
  productId?: string;
  coverUrl?: string;
  productName: string;
}

export function MembersAreaCover({ productId, coverUrl, productName }: MembersAreaCoverProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [localCoverUrl, setLocalCoverUrl] = useState(coverUrl);

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !productId) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}/cover.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      // Update product settings
      const { error: updateError } = await supabase
        .from('products')
        .update({
          members_area_settings: {
            cover_url: publicUrl,
          }
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      setLocalCoverUrl(publicUrl);
      toast.success("Capa atualizada com sucesso!");
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error("Erro ao fazer upload da capa");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative w-full h-48 md:h-64 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden group">
      {localCoverUrl ? (
        <img 
          src={localCoverUrl} 
          alt="Capa da área de membros"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

      {/* Product Name */}
      <div className="absolute bottom-0 left-0 right-0 p-6 max-w-7xl mx-auto">
        <p className="text-sm text-muted-foreground mb-1">Área de Membros</p>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {productName}
        </h1>
      </div>

      {/* Edit Button */}
      <label className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
        <input
          type="file"
          accept="image/*"
          onChange={handleCoverUpload}
          className="hidden"
          disabled={isUploading}
        />
        <Button 
          variant="secondary" 
          size="sm" 
          className="gap-2 pointer-events-none"
          disabled={isUploading}
        >
          {isUploading ? (
            <Upload className="h-4 w-4 animate-pulse" />
          ) : (
            <Pencil className="h-4 w-4" />
          )}
          Editar Capa
        </Button>
      </label>
    </div>
  );
}
