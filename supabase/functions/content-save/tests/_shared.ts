/**
 * Shared Types & Mock Data for content-save Tests
 * 
 * @module content-save/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ContentData {
  title: string;
  video_url?: string | null;
  body?: string | null;
}

export interface ReleaseData {
  release_type: "immediate" | "days_after_purchase" | "fixed_date" | "after_content";
  days_after_purchase?: number | null;
  fixed_date?: string | null;
  after_content_id?: string | null;
}

export interface AttachmentData {
  id: string;
  file_name: string;
  file_url?: string;
  file_type: string;
  file_size: number;
  position: number;
  is_temp?: boolean;
  file_data?: string;
}

export interface Module {
  id: string;
  product_id: string;
  owner_id: string;
}

export interface ContentRecord {
  id: string;
  module_id: string;
  title: string;
  content_type: string;
  content_url: string | null;
  body: string | null;
  is_active: boolean;
  position: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_MODULES: Module[] = [
  { id: "mod-1", product_id: "prod-1", owner_id: "user-123" },
  { id: "mod-2", product_id: "prod-2", owner_id: "user-456" },
];

export const MOCK_CONTENT: ContentRecord = {
  id: "content-1",
  module_id: "mod-1",
  title: "Aula 1",
  content_type: "mixed",
  content_url: "https://vimeo.com/123",
  body: "<p>Conteúdo da aula</p>",
  is_active: true,
  position: 0,
};

export const MOCK_ATTACHMENTS: AttachmentData[] = [
  {
    id: "att-1",
    file_name: "material.pdf",
    file_url: "https://storage.example.com/material.pdf",
    file_type: "application/pdf",
    file_size: 1024000,
    position: 0,
    is_temp: false,
  },
  {
    id: "temp-2",
    file_name: "novo-arquivo.docx",
    file_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    file_size: 512000,
    position: 1,
    is_temp: true,
    file_data: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDB...",
  },
];

export const VALID_RELEASE_TYPES = ["immediate", "days_after_purchase", "fixed_date", "after_content"];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function verifyModuleOwnership(
  moduleId: string, 
  producerId: string
): { valid: boolean; productId?: string; error?: string } {
  const module = MOCK_MODULES.find(m => m.id === moduleId);
  if (!module) {
    return { valid: false, error: "Módulo não encontrado" };
  }
  if (module.owner_id !== producerId) {
    return { valid: false, error: "Você não tem permissão para acessar este módulo" };
  }
  return { valid: true, productId: module.product_id };
}

export function validateTitle(title: unknown): boolean {
  if (!title || typeof title !== "string") return false;
  return title.trim().length > 0;
}

export function isValidReleaseType(type: string): boolean {
  return VALID_RELEASE_TYPES.includes(type);
}

export function isValidBase64(data: string): boolean {
  const base64Regex = /^data:([^;]+);base64,(.+)$/;
  return base64Regex.test(data);
}

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function getOrphanAttachmentIds(
  existingIds: string[],
  incomingIds: string[]
): string[] {
  const incomingSet = new Set(incomingIds.filter(id => !id.startsWith("temp-")));
  return existingIds.filter(id => !incomingSet.has(id));
}

export function getNextPosition(existingPositions: number[]): number {
  if (existingPositions.length === 0) return 0;
  return Math.max(...existingPositions) + 1;
}
