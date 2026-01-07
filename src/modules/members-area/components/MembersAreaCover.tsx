/**
 * MembersAreaCover - Capa visual da área de membros (display only)
 */

import { Image as ImageIcon } from "lucide-react";

interface MembersAreaCoverProps {
  coverUrl?: string;
  productName: string;
}

export function MembersAreaCover({ coverUrl, productName }: MembersAreaCoverProps) {
  return (
    <div className="relative w-full h-48 md:h-64 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
      {coverUrl ? (
        <img 
          src={coverUrl} 
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
    </div>
  );
}
