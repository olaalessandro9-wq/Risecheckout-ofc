/**
 * Types for Members Area Tab components
 */

export interface ContentTypeOption {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface ContentFormData {
  title: string;
  description: string;
  contentType: string;
  contentUrl: string;
}

export interface EditingContent {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  content_url: string | null;
}
