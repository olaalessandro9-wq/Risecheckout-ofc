/**
 * ImageCropDialog Presets
 * 
 * Configurações predefinidas para diferentes casos de uso de crop.
 * Adicione novos presets aqui - não é necessário criar novos componentes.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import type { CropConfig } from "./types";

/**
 * Presets de crop predefinidos
 * 
 * Para adicionar um novo preset:
 * 1. Adicione uma nova entrada neste objeto
 * 2. Use com <ImageCropDialog preset="nomeDoNovoPreset" />
 */
export const CROP_PRESETS = {
  /**
   * Módulo da área de membros (thumbnail vertical)
   * Usado em: AddModuleDialogNetflix, EditModuleDialogNetflix
   */
  module: {
    aspectRatio: 2 / 3,
    outputWidth: 320,
    outputHeight: 480,
    label: "Módulo (2:3)",
  },

  /**
   * Banner widescreen (16:9)
   * Usado em: FixedHeaderImageUpload, BannerSlideUpload
   */
  banner: {
    aspectRatio: 16 / 9,
    outputWidth: 1920,
    outputHeight: 1080,
    label: "Banner (16:9)",
  },

  /**
   * Imagem de produto (4:3)
   * Usado em: ImageSelector de produtos
   */
  product: {
    aspectRatio: 4 / 3,
    outputWidth: 800,
    outputHeight: 600,
    label: "Produto (4:3)",
  },

  /**
   * Avatar/Perfil (quadrado)
   * Para imagens de perfil e avatares
   */
  square: {
    aspectRatio: 1,
    outputWidth: 400,
    outputHeight: 400,
    label: "Quadrado (1:1)",
  },

  /**
   * Story/Reels (vertical fullscreen)
   * Para conteúdos verticais estilo Instagram Stories
   */
  story: {
    aspectRatio: 9 / 16,
    outputWidth: 1080,
    outputHeight: 1920,
    label: "Story (9:16)",
  },

  /**
   * Thumbnail de vídeo (16:9 menor)
   * Para previews de vídeos e cards
   */
  videoThumbnail: {
    aspectRatio: 16 / 9,
    outputWidth: 1280,
    outputHeight: 720,
    label: "Vídeo (16:9)",
  },

  /**
   * Card horizontal (3:2)
   * Para cards e listagens
   */
  card: {
    aspectRatio: 3 / 2,
    outputWidth: 600,
    outputHeight: 400,
    label: "Card (3:2)",
  },
} as const satisfies Record<string, CropConfig>;

/**
 * Preset padrão usado quando nenhum é especificado
 */
export const DEFAULT_PRESET: keyof typeof CROP_PRESETS = "product";

/**
 * Obtém a configuração de crop a partir de um preset ou config customizada
 */
export function getCropConfig(
  preset?: keyof typeof CROP_PRESETS,
  customConfig?: CropConfig
): CropConfig {
  // Custom config tem prioridade
  if (customConfig) {
    return customConfig;
  }

  // Usa o preset especificado ou o default
  const presetName = preset ?? DEFAULT_PRESET;
  return CROP_PRESETS[presetName];
}
