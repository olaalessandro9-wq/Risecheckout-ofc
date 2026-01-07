/**
 * useDripSettings - Hook for managing drip content settings
 * 
 * Handles CRUD operations for content_release_settings table
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ReleaseType, DripFormData } from "../types";

interface UseDripSettingsReturn {
  isLoading: boolean;
  fetchDripSettings: (contentId: string) => Promise<DripFormData | null>;
  saveDripSettings: (contentId: string, settings: DripFormData) => Promise<boolean>;
  deleteDripSettings: (contentId: string) => Promise<boolean>;
}

const DEFAULT_DRIP: DripFormData = {
  release_type: "immediate",
  days_after_purchase: null,
  fixed_date: null,
  after_content_id: null,
};

export function useDripSettings(): UseDripSettingsReturn {
  const [isLoading, setIsLoading] = useState(false);

  const fetchDripSettings = useCallback(async (contentId: string): Promise<DripFormData | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("content_release_settings")
        .select("*")
        .eq("content_id", contentId)
        .maybeSingle();

      if (error) {
        console.error("[useDripSettings] Error fetching:", error);
        return null;
      }

      if (!data) {
        return DEFAULT_DRIP;
      }

      return {
        release_type: data.release_type as ReleaseType,
        days_after_purchase: data.days_after_purchase,
        fixed_date: data.fixed_date,
        after_content_id: data.after_content_id,
      };
    } catch (err) {
      console.error("[useDripSettings] Exception:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveDripSettings = useCallback(async (contentId: string, settings: DripFormData): Promise<boolean> => {
    setIsLoading(true);
    try {
      // If release type is immediate, delete any existing settings
      if (settings.release_type === "immediate") {
        const { error } = await supabase
          .from("content_release_settings")
          .delete()
          .eq("content_id", contentId);

        if (error) {
          console.error("[useDripSettings] Error deleting immediate:", error);
          return false;
        }
        return true;
      }

      // Upsert the settings
      const { error } = await supabase
        .from("content_release_settings")
        .upsert({
          content_id: contentId,
          release_type: settings.release_type,
          days_after_purchase: settings.release_type === "days_after_purchase" ? settings.days_after_purchase : null,
          fixed_date: settings.release_type === "fixed_date" ? settings.fixed_date : null,
          after_content_id: settings.release_type === "after_content" ? settings.after_content_id : null,
        }, {
          onConflict: "content_id",
        });

      if (error) {
        console.error("[useDripSettings] Error upserting:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("[useDripSettings] Exception:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDripSettings = useCallback(async (contentId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("content_release_settings")
        .delete()
        .eq("content_id", contentId);

      if (error) {
        console.error("[useDripSettings] Error deleting:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("[useDripSettings] Exception:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    fetchDripSettings,
    saveDripSettings,
    deleteDripSettings,
  };
}
