/**
 * Members Area Hook Types
 * Shared types for all useMembersArea sub-hooks
 */

import type { Json } from "@/integrations/supabase/types";
import type { ContentDisplayType } from "@/modules/members-area/types";

export type { ContentDisplayType } from "@/modules/members-area/types";

export interface MemberModule {
  id: string;
  product_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemberContent {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  content_type: ContentDisplayType;
  content_url: string | null;
  body: string | null;
  content_data: Json | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemberModuleWithContents extends MemberModule {
  contents: MemberContent[];
}

export interface MembersAreaSettings {
  enabled: boolean;
  settings: Json | null;
}

export interface UseMembersAreaReturn {
  isLoading: boolean;
  isSaving: boolean;
  settings: MembersAreaSettings;
  modules: MemberModuleWithContents[];
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
