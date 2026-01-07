/**
 * Members Area Hook Types
 * 
 * Re-exports canonical types from module + defines hook-specific types
 * This ensures Single Source of Truth for all Members Area types
 */

import type { Json } from "@/integrations/supabase/types";
import type { 
  MemberModule, 
  MemberContent, 
  ModuleWithContents 
} from "@/modules/members-area/types";

// Re-export canonical types for backwards compatibility
export type { 
  ContentDisplayType,
  MemberModule,
  MemberContent,
} from "@/modules/members-area/types";

// Alias for backwards compatibility with existing code
export type MemberModuleWithContents = ModuleWithContents;

// Hook-specific types (not in module types)
export interface MembersAreaSettings {
  enabled: boolean;
  settings: Json | null;
}

export interface UseMembersAreaReturn {
  isLoading: boolean;
  isSaving: boolean;
  settings: MembersAreaSettings;
  modules: ModuleWithContents[];
  updateSettings: (enabled: boolean, settings?: Json) => Promise<void>;
  fetchModules: () => Promise<void>;
  addModule: (title: string, description?: string, coverImageUrl?: string) => Promise<MemberModule | null>;
  updateModule: (id: string, data: Partial<MemberModule>) => Promise<void>;
  deleteModule: (id: string) => Promise<void>;
  reorderModules: (orderedIds: string[]) => Promise<void>;
  addContent: (moduleId: string, data: Omit<MemberContent, "id" | "module_id" | "position" | "created_at" | "updated_at">) => Promise<MemberContent | null>;
  updateContent: (id: string, data: Partial<MemberContent>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  reorderContents: (moduleId: string, orderedIds: string[]) => Promise<void>;
}
