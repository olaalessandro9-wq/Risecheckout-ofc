/**
 * Componente: PixelLibrary
 * Biblioteca de pixels do vendedor - lista, adiciona, edita e exclui pixels
 */

import { useState } from "react";
import { Plus, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PixelCard } from "./PixelCard";
import { PixelForm } from "./PixelForm";
import { PlatformIcon } from "./PlatformIcon";
import { useVendorPixels } from "@/hooks/useVendorPixels";
import type { VendorPixel, PixelFormData, PixelPlatform } from "./types";
import { PLATFORM_INFO } from "./types";

const PLATFORMS: PixelPlatform[] = ['facebook', 'tiktok', 'google_ads', 'kwai'];

export function PixelLibrary() {
  const { pixels, isLoading, isSaving, refetch, createPixel, updatePixel, deletePixel } = useVendorPixels();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingPixel, setEditingPixel] = useState<VendorPixel | null>(null);
  const [deletingPixel, setDeletingPixel] = useState<VendorPixel | null>(null);

  // Agrupar pixels por plataforma
  const pixelsByPlatform = PLATFORMS.reduce((acc, platform) => {
    acc[platform] = pixels.filter(p => p.platform === platform);
    return acc;
  }, {} as Record<PixelPlatform, VendorPixel[]>);

  const handleAddClick = () => {
    setEditingPixel(null);
    setFormOpen(true);
  };

  const handleEditClick = (pixel: VendorPixel) => {
    setEditingPixel(pixel);
    setFormOpen(true);
  };

  const handleDeleteClick = (pixel: VendorPixel) => {
    setDeletingPixel(pixel);
  };

  const handleSave = async (data: PixelFormData) => {
    let success: boolean;
    
    if (editingPixel) {
      success = await updatePixel(editingPixel.id, data);
    } else {
      success = await createPixel(data);
    }

    if (success) {
      setFormOpen(false);
      setEditingPixel(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingPixel) {
      await deletePixel(deletingPixel.id);
      setDeletingPixel(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasAnyPixels = pixels.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Cadastre seus pixels uma vez e vincule aos produtos.
          </p>
        </div>
        <Button onClick={handleAddClick} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Pixel
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Após cadastrar um pixel aqui, vá nas configurações do produto para vincular os pixels que deseja usar.
        </AlertDescription>
      </Alert>

      {/* Empty State */}
      {!hasAnyPixels && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            Você ainda não tem nenhum pixel cadastrado.
          </p>
          <Button onClick={handleAddClick} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar primeiro pixel
          </Button>
        </div>
      )}

      {/* Pixels agrupados por plataforma */}
      {hasAnyPixels && (
        <div className="space-y-6">
          {PLATFORMS.map((platform) => {
            const platformPixels = pixelsByPlatform[platform];
            if (platformPixels.length === 0) return null;

            const info = PLATFORM_INFO[platform];

            return (
              <div key={platform} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <PlatformIcon platform={platform} size={16} />
                  <span>{info.label}</span>
                  <span className="text-xs">({platformPixels.length})</span>
                </div>

                <div className="space-y-2">
                  {platformPixels.map((pixel) => (
                    <PixelCard
                      key={pixel.id}
                      pixel={pixel}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <PixelForm
        open={formOpen}
        onOpenChange={setFormOpen}
        pixel={editingPixel}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPixel} onOpenChange={() => setDeletingPixel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pixel</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o pixel "{deletingPixel?.name}"?
              {deletingPixel?.linked_products_count && deletingPixel.linked_products_count > 0 && (
                <span className="block mt-2 text-destructive">
                  ⚠️ Este pixel está vinculado a {deletingPixel.linked_products_count} produto(s).
                  Ao excluir, ele será removido de todos os produtos.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
