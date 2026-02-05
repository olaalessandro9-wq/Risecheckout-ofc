/**
 * ImageCropDialog - Componente Unificado de Crop de Imagem
 * 
 * @example
 * import { ImageCropDialog, CROP_PRESETS } from "@/components/ui/image-crop-dialog";
 * 
 * <ImageCropDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   imageFile={file}
 *   onCropComplete={handleCrop}
 *   preset="module"
 * />
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

export { ImageCropDialog } from "./ImageCropDialog";
export { CROP_PRESETS, getCropConfig, DEFAULT_PRESET, DEFAULT_BACKGROUND_COLOR } from "./presets";
export type { ImageCropDialogProps, CropConfig, CropPresetName } from "./types";
