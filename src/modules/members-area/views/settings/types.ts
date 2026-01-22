/**
 * Settings Types - Tipos para configurações da área de membros
 */

export interface MembersAreaSettingsData {
  // Theme
  layout_style: "netflix" | "classic" | "grid";
  primary_color: string;
  dark_mode_enabled: boolean;
  custom_logo_url: string | null;
  
  // Access Control
  drip_enabled: boolean;
  drip_interval_days: number;
  drip_interval_unit: "days" | "weeks" | "months";
  require_sequential_progress: boolean;
  completion_percentage: number;
  allow_downloads: boolean;
  
  // Notifications
  send_welcome_email: boolean;
  notify_new_content: boolean;
  send_completion_certificate: boolean;
  send_inactivity_reminder: boolean;
  notify_progress_milestones: boolean;
}

export const DEFAULT_SETTINGS: MembersAreaSettingsData = {
  // Theme
  layout_style: "netflix",
  primary_color: "#3B82F6",
  dark_mode_enabled: false,
  custom_logo_url: null,
  
  // Access Control
  drip_enabled: false,
  drip_interval_days: 7,
  drip_interval_unit: "days",
  require_sequential_progress: false,
  completion_percentage: 80,
  allow_downloads: true,
  
  // Notifications
  send_welcome_email: true,
  notify_new_content: true,
  send_completion_certificate: true,
  send_inactivity_reminder: false,
  notify_progress_milestones: false,
};

export function parseSettingsFromJson(json: unknown): MembersAreaSettingsData {
  if (!json || typeof json !== "object") {
    return { ...DEFAULT_SETTINGS };
  }
  
  const data = json as Record<string, unknown>;
  
  return {
    layout_style: (data.layout_style as MembersAreaSettingsData["layout_style"]) || DEFAULT_SETTINGS.layout_style,
    primary_color: (data.primary_color as string) || DEFAULT_SETTINGS.primary_color,
    dark_mode_enabled: typeof data.dark_mode_enabled === "boolean" ? data.dark_mode_enabled : DEFAULT_SETTINGS.dark_mode_enabled,
    custom_logo_url: (data.custom_logo_url as string | null) ?? DEFAULT_SETTINGS.custom_logo_url,
    
    drip_enabled: typeof data.drip_enabled === "boolean" ? data.drip_enabled : DEFAULT_SETTINGS.drip_enabled,
    drip_interval_days: typeof data.drip_interval_days === "number" ? data.drip_interval_days : DEFAULT_SETTINGS.drip_interval_days,
    drip_interval_unit: (data.drip_interval_unit as MembersAreaSettingsData["drip_interval_unit"]) || DEFAULT_SETTINGS.drip_interval_unit,
    require_sequential_progress: typeof data.require_sequential_progress === "boolean" ? data.require_sequential_progress : DEFAULT_SETTINGS.require_sequential_progress,
    completion_percentage: typeof data.completion_percentage === "number" ? data.completion_percentage : DEFAULT_SETTINGS.completion_percentage,
    allow_downloads: typeof data.allow_downloads === "boolean" ? data.allow_downloads : DEFAULT_SETTINGS.allow_downloads,
    
    send_welcome_email: typeof data.send_welcome_email === "boolean" ? data.send_welcome_email : DEFAULT_SETTINGS.send_welcome_email,
    notify_new_content: typeof data.notify_new_content === "boolean" ? data.notify_new_content : DEFAULT_SETTINGS.notify_new_content,
    send_completion_certificate: typeof data.send_completion_certificate === "boolean" ? data.send_completion_certificate : DEFAULT_SETTINGS.send_completion_certificate,
    send_inactivity_reminder: typeof data.send_inactivity_reminder === "boolean" ? data.send_inactivity_reminder : DEFAULT_SETTINGS.send_inactivity_reminder,
    notify_progress_milestones: typeof data.notify_progress_milestones === "boolean" ? data.notify_progress_milestones : DEFAULT_SETTINGS.notify_progress_milestones,
  };
}
