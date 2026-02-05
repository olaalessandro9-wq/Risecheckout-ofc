/**
 * ImageCropDialog Types
 * 
 * Tipos centralizados para o componente de crop de imagem unificado.
 * Suporta presets predefinidos e configurações customizadas.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { CROP_PRESETS } from "./presets";

/**
 * Configuração de crop que define as dimensões e proporção
 */
export interface CropConfig {
  /** Proporção largura/altura (ex: 16/9 = 1.777...) */
  aspectRatio: number;
  /** Largura da imagem de saída em pixels */
  outputWidth: number;
  /** Altura da imagem de saída em pixels */
  outputHeight: number;
  /** Label legível para exibição (opcional) */
  label?: string;
  /** Cor de fundo para áreas não cobertas pela imagem (default: "#1a1a2e") */
  backgroundColor?: string;
}

/**
 * Nomes dos presets disponíveis
 */
export type CropPresetName = keyof typeof CROP_PRESETS;

/**
 * Props do componente ImageCropDialog
 */
export interface ImageCropDialogProps {
  /** Controla se o dialog está aberto */
  open: boolean;
  /** Callback quando o estado de abertura muda */
  onOpenChange: (open: boolean) => void;
  /** Arquivo de imagem a ser editado */
  imageFile: File;
  /** Callback quando o crop é concluído com sucesso */
  onCropComplete: (croppedFile: File) => void;
  /** 
   * Nome do preset predefinido a ser usado.
   * Use isto para casos comuns (module, banner, product, etc.)
   */
  preset?: CropPresetName;
  /**
   * Configuração customizada de crop.
   * Sobrescreve o preset se ambos forem fornecidos.
   * Use isto para casos especiais que não se encaixam nos presets.
   */
  customConfig?: CropConfig;
  /**
   * Título customizado do dialog (opcional)
   * Default: "Editar Imagem"
   */
  title?: string;
  /**
   * Subtítulo customizado do dialog (opcional)
   * Default: "Ajuste a imagem para o tamanho desejado"
   */
  subtitle?: string;
  /**
   * Permite trocar entre presets durante o crop (mostra dropdown)
   */
  allowPresetChange?: boolean;
  /**
   * Quais presets aparecem no dropdown (requer allowPresetChange=true)
   * Default: todos os presets disponíveis
   */
  availablePresets?: CropPresetName[];
}
