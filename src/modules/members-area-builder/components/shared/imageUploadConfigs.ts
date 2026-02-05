/**
 * Image Upload Configs - Configurações para cada tipo de upload de imagem
 * 
 * Centraliza as diferenças entre upload de header, banner, etc.
 * O componente genérico ImageUploadWithCrop consome essas configs.
 * 
 * Para adicionar um novo tipo de upload:
 * 1. Adicione uma nova config neste arquivo
 * 2. Use <ImageUploadWithCrop config={NOVA_CONFIG} ... />
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import type { CropPresetName } from "@/components/ui/image-crop-dialog";

/**
 * Configuração que define o comportamento de um ImageUploadWithCrop
 */
export interface ImageUploadConfig {
  /** Nome para o logger (identificação em logs) */
  loggerName: string;
  /** Prefixo do nome do arquivo no storage (ex: "header", "banner") */
  filePrefix: string;
  /** Caminho no storage bucket (ex: "headers", "banners") */
  storagePath: string;
  /** Texto alternativo para o preview da imagem */
  altText: string;
  /** Preset de crop a ser usado */
  cropPreset: CropPresetName;
  /** Tamanho máximo do arquivo em MB */
  maxSizeMB: number;
  /** Tipos MIME aceitos */
  acceptedTypes: string[];
}

/** Tipos MIME padrão aceitos para imagens */
const DEFAULT_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * Config para upload de imagem do Fixed Header
 */
export const HEADER_UPLOAD_CONFIG: ImageUploadConfig = {
  loggerName: "ImageUpload:Header",
  filePrefix: "header",
  storagePath: "headers",
  altText: "Preview da header",
  cropPreset: "banner",
  maxSizeMB: 10,
  acceptedTypes: DEFAULT_ACCEPTED_TYPES,
};

/**
 * Config para upload de imagem de slides do Banner
 */
export const BANNER_UPLOAD_CONFIG: ImageUploadConfig = {
  loggerName: "ImageUpload:Banner",
  filePrefix: "banner",
  storagePath: "banners",
  altText: "Preview do slide",
  cropPreset: "banner",
  maxSizeMB: 10,
  acceptedTypes: DEFAULT_ACCEPTED_TYPES,
};
