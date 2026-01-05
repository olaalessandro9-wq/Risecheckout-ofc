/**
 * Types for Members Area Modules and Content
 * Netflix-style course structure
 */

/** Available content types in the members area */
export type ContentType = 
  | 'video'
  | 'pdf'
  | 'text'
  | 'download'
  | 'quiz'
  | 'live';

/** Content release type for drip functionality */
export type ReleaseType = 
  | 'immediate'
  | 'days_after_purchase'
  | 'fixed_date'
  | 'after_content';

/** Individual content item within a module */
export interface MemberContent {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  content_type: ContentType;
  content_url: string | null;
  body: string | null;
  content_data: Record<string, unknown> | null;
  duration_seconds: number | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Content with release settings */
export interface ContentWithRelease extends MemberContent {
  release_settings?: ContentReleaseSettings;
}

/** Settings for content drip/release */
export interface ContentReleaseSettings {
  id: string;
  content_id: string;
  release_type: ReleaseType;
  days_after_purchase: number | null;
  fixed_date: string | null;
  after_content_id: string | null;
}

/** Module (course section) structure */
export interface MemberModule {
  id: string;
  product_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  width: number | null;
  height: number | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Module with its contents loaded */
export interface ModuleWithContents extends MemberModule {
  contents: MemberContent[];
}

/** Input for creating a new module */
export interface CreateModuleInput {
  product_id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  width?: number;
  height?: number;
  position?: number;
}

/** Input for updating a module */
export interface UpdateModuleInput {
  title?: string;
  description?: string;
  cover_image_url?: string;
  width?: number;
  height?: number;
  position?: number;
  is_active?: boolean;
}

/** Input for creating content */
export interface CreateContentInput {
  module_id: string;
  title: string;
  description?: string;
  content_type: ContentType;
  content_url?: string;
  body?: string;
  content_data?: Record<string, unknown>;
  duration_seconds?: number;
  position?: number;
}

/** Input for updating content */
export interface UpdateContentInput {
  title?: string;
  description?: string;
  content_type?: ContentType;
  content_url?: string;
  body?: string;
  content_data?: Record<string, unknown>;
  duration_seconds?: number;
  position?: number;
  is_active?: boolean;
}

/** Data structure for editing a module in dialogs */
export interface EditingModuleData {
  id: string;
  title: string;
  cover_image_url: string | null;
}
