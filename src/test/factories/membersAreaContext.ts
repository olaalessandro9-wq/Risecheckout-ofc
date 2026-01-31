/**
 * Members Area Context Test Factories
 * 
 * Type-safe factory functions for mocking Members Area contexts and types.
 * 
 * @module test/factories/membersAreaContext
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import type { Json } from "@/integrations/supabase/types";
import type {
  MemberModule,
  MemberContent,
  ModuleWithContents,
  ContentDisplayType,
  ReleaseType,
  ContentReleaseSettings,
  ContentAttachment,
} from "@/modules/members-area/types";
import type { UseMembersAreaReturn, MembersAreaSettings } from "@/modules/members-area/hooks/types";
import type { MembersAreaMachineContext } from "@/modules/members-area/hooks/machines/membersAreaMachine.types";

// ============================================================================
// CONTENT FACTORIES
// ============================================================================

export function createMockMemberContent(
  overrides?: Partial<MemberContent>
): MemberContent {
  return {
    id: "content-123",
    module_id: "module-123",
    title: "Test Content",
    description: "Test content description",
    content_type: "video" as ContentDisplayType,
    content_url: "https://example.com/video.mp4",
    body: null,
    content_data: null,
    duration_seconds: 600,
    position: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockContentAttachment(
  overrides?: Partial<ContentAttachment>
): ContentAttachment {
  return {
    id: "attachment-123",
    content_id: "content-123",
    file_name: "document.pdf",
    file_url: "https://example.com/document.pdf",
    file_type: "application/pdf",
    file_size: 1024,
    position: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockContentReleaseSettings(
  overrides?: Partial<ContentReleaseSettings>
): ContentReleaseSettings {
  return {
    id: "release-123",
    content_id: "content-123",
    release_type: "immediate" as ReleaseType,
    days_after_purchase: null,
    fixed_date: null,
    after_content_id: null,
    ...overrides,
  };
}

// ============================================================================
// MODULE FACTORIES
// ============================================================================

export function createMockMemberModule(
  overrides?: Partial<MemberModule>
): MemberModule {
  return {
    id: "module-123",
    product_id: "product-123",
    title: "Test Module",
    description: "Test module description",
    cover_image_url: null,
    width: null,
    height: null,
    position: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockModuleWithContents(
  overrides?: Partial<ModuleWithContents>
): ModuleWithContents {
  return {
    ...createMockMemberModule(),
    contents: [],
    ...overrides,
  };
}

// ============================================================================
// MEMBERS AREA SETTINGS FACTORY
// ============================================================================

export function createMockMembersAreaSettings(
  overrides?: Partial<MembersAreaSettings>
): MembersAreaSettings {
  return {
    enabled: false,
    settings: null,
    ...overrides,
  };
}

// ============================================================================
// USE MEMBERS AREA RETURN FACTORY
// ============================================================================

export function createMockUseMembersAreaReturn(
  overrides?: Partial<UseMembersAreaReturn>
): UseMembersAreaReturn {
  return {
    isLoading: false,
    isSaving: false,
    settings: createMockMembersAreaSettings(),
    modules: [],
    updateSettings: vi.fn().mockResolvedValue(undefined),
    fetchModules: vi.fn().mockResolvedValue(undefined),
    addModule: vi.fn().mockResolvedValue(createMockMemberModule()),
    updateModule: vi.fn().mockResolvedValue(undefined),
    deleteModule: vi.fn().mockResolvedValue(undefined),
    reorderModules: vi.fn().mockResolvedValue(undefined),
    addContent: vi.fn().mockResolvedValue(createMockMemberContent()),
    updateContent: vi.fn().mockResolvedValue(undefined),
    deleteContent: vi.fn().mockResolvedValue(undefined),
    reorderContents: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ============================================================================
// MEMBERS AREA MACHINE CONTEXT FACTORY
// ============================================================================

export function createMockMembersAreaMachineContext(
  overrides?: Partial<MembersAreaMachineContext>
): MembersAreaMachineContext {
  return {
    modules: [],
    originalModules: [],
    isSaving: false,
    loadError: null,
    saveError: null,
    ...overrides,
  };
}

// ============================================================================
// MEMBERS AREA MACHINE SNAPSHOT FACTORY
// ============================================================================

export interface MockMembersAreaSnapshot {
  context: MembersAreaMachineContext;
  value: string | Record<string, unknown>;
  matches: (state: string) => boolean;
  can: (event: { type: string }) => boolean;
  status: "active" | "done" | "error" | "stopped";
}

export function createMockMembersAreaSnapshot(
  context?: Partial<MembersAreaMachineContext>,
  stateValue: string | Record<string, unknown> = "ready"
): MockMembersAreaSnapshot {
  const fullContext = createMockMembersAreaMachineContext(context);
  
  return {
    context: fullContext,
    value: stateValue,
    matches: vi.fn((state: string) => {
      if (typeof stateValue === "string") {
        return state === stateValue;
      }
      return Object.keys(stateValue).includes(state);
    }),
    can: vi.fn(() => true),
    status: "active",
  };
}
