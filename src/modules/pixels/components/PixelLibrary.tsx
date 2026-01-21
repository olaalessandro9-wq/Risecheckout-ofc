/**
 * PixelLibrary Component
 * 
 * @module modules/pixels/components
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Biblioteca de pixels do vendedor - lista, adiciona, edita e exclui pixels.
 * Consome estado do PixelsContext (SSOT).
 */

import { Plus, RefreshCw, Info, AlertTriangle } from "lucide-react";
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
import { usePixelsContext } from "../context/PixelsContext";
import { PLATFORM_INFO, PIXEL_PLATFORMS } from "../types";
import type { VendorPixel, PixelPlatform } from "../types";

// ============================================================================
// COMPONENT
// ============================================================================

export function PixelLibrary() {
  const { 
    pixels, 
    isLoading, 
    isError,
    error,
    deletingPixel,
    openForm, 
    requestDelete,
    cancelDelete,
    confirmDelete,
    refresh,
  } = usePixelsContext();

  // Agrupar pixels por plataforma
  const pixelsByPlatform = PIXEL_PLATFORMS.reduce((acc, platform) => {
    acc[platform] = pixels.filter(p => p.platform === platform);
    return acc;
  }, {} as Record<PixelPlatform, VendorPixel[]>);

  // ========================================================================
  // LOADING STATE
  // ========================================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ========================================================================
  // ERROR STATE
  // ========================================================================
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error ?? "Erro ao carregar pixels"}</p>
        <Button variant="outline" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
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
        <Button onClick={() => openForm()} size="sm">
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
          <Button onClick={() => openForm()} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar primeiro pixel
          </Button>
        </div>
      )}

      {/* Pixels agrupados por plataforma */}
      {hasAnyPixels && (
        <div className="space-y-6">
          {PIXEL_PLATFORMS.map((platform) => {
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
                      onEdit={openForm}
                      onDelete={requestDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog - controlled by context */}
      <PixelForm />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPixel} onOpenChange={() => cancelDelete()}>
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
            <AlertDialogCancel onClick={cancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
