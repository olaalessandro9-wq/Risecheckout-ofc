/**
 * Shared Test Utilities for content-crud
 * 
 * @module content-crud/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { 
  skipIntegration, 
  integrationTestOptions,
  getTestConfig 
} from "../../_shared/testing/mod.ts";

// Re-export testing utilities
export { skipIntegration, integrationTestOptions, getTestConfig };

// ============================================
// CONSTANTS
// ============================================

const config = getTestConfig();

export function getFunctionUrl(): string {
  return config.supabaseUrl
    ? `${config.supabaseUrl}/functions/v1/content-crud`
    : "https://mock.supabase.co/functions/v1/content-crud";
}

export const CONTENT_TYPES = ["video", "text", "pdf", "audio", "quiz"] as const;
export type ContentType = typeof CONTENT_TYPES[number];

export const ACTIONS = ["create", "update", "delete", "reorder"] as const;
export type Action = typeof ACTIONS[number];

// ============================================
// TYPES
// ============================================

export interface MockProducer {
  id: string;
  email: string;
}

export interface ContentData {
  title?: string;
  content_type?: ContentType | string;
  content_url?: string | null;
  body?: string | null;
  is_active?: boolean;
  duration_seconds?: number;
}

export interface CreateRequest {
  action: "create";
  moduleId: string;
  data: ContentData;
}

export interface UpdateRequest {
  action: "update";
  contentId: string;
  data: Partial<ContentData>;
}

export interface DeleteRequest {
  action: "delete";
  contentId: string;
}

export interface ReorderRequest {
  action: "reorder";
  moduleId: string;
  orderedIds: string[];
}

export type ContentRequest = CreateRequest | UpdateRequest | DeleteRequest | ReorderRequest;

// ============================================
// MOCK FACTORIES
// ============================================

export function createMockSupabaseClient(): Record<string, unknown> {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: {}, error: null }),
        }),
      }),
      insert: () => Promise.resolve({ data: {}, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: {}, error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  };
}

export function createDefaultProducer(): MockProducer {
  return {
    id: "producer-123",
    email: "producer@example.com",
  };
}

export function createVideoContent(overrides?: Partial<ContentData>): ContentData {
  return {
    title: "Test Video Content",
    content_type: "video",
    content_url: "https://example.com/video.mp4",
    is_active: true,
    duration_seconds: 3600,
    ...overrides,
  };
}

export function createTextContent(overrides?: Partial<ContentData>): ContentData {
  return {
    title: "Test Text Content",
    content_type: "text",
    body: "This is the text content body.",
    is_active: true,
    ...overrides,
  };
}

// ============================================
// TYPE GUARDS
// ============================================

export function isValidContentType(value: string): value is ContentType {
  return CONTENT_TYPES.includes(value as ContentType);
}

export function isValidAction(value: string): value is Action {
  return ACTIONS.includes(value as Action);
}

// ============================================
// REQUEST HELPERS
// ============================================

export function createIntegrationRequest(body: Record<string, unknown>): RequestInit {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}
