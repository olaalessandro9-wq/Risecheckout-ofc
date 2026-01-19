/**
 * useContentDrip Hook
 * 
 * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import type { ContentReleaseSettings, ContentAccessStatus, ReleaseType } from '../types';

const log = createLogger("UseContentDrip");

interface DripSettingsResponse {
  settings?: Array<{
    id: string;
    content_id: string;
    release_type: string;
    days_after_purchase?: number;
    fixed_date?: string;
    after_content_id?: string;
  }>;
}

interface UseContentDripReturn {
  isLoading: boolean;
  checkContentAccess: (contentId: string, buyerId: string, purchaseDate: string) => Promise<ContentAccessStatus>;
  getDripSettings: (productId: string) => Promise<Map<string, ContentReleaseSettings>>;
  calculateUnlockDate: (settings: ContentReleaseSettings, purchaseDate: string) => Date | null;
}

export function useContentDrip(): UseContentDripReturn {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get all drip settings for a product's contents via Edge Function
   * MIGRATED: Uses supabase.functions.invoke instead of supabase.from()
   */
  const getDripSettings = useCallback(async (
    productId: string
  ): Promise<Map<string, ContentReleaseSettings>> => {
    setIsLoading(true);

    const settingsMap = new Map<string, ContentReleaseSettings>();

    try {
      const { data, error } = await api.call<DripSettingsResponse>("admin-data", {
        action: "content-drip-settings",
        productId,
      });

      if (error) throw new Error(error.message);

      const settings = data?.settings || [];
      settings.forEach((s: Record<string, unknown>) => {
        settingsMap.set(s.content_id as string, {
          id: s.id as string,
          content_id: s.content_id as string,
          release_type: s.release_type as ReleaseType,
          days_after_purchase: s.days_after_purchase as number | undefined,
          fixed_date: s.fixed_date as string | undefined,
          after_content_id: s.after_content_id as string | undefined,
        });
      });
    } catch (error) {
      log.error("Error fetching settings:", error);
    }

    setIsLoading(false);
    return settingsMap;
  }, []);

  /**
   * Calculate when content will be unlocked based on release settings
   */
  const calculateUnlockDate = useCallback((
    settings: ContentReleaseSettings,
    purchaseDate: string
  ): Date | null => {
    const purchase = new Date(purchaseDate);

    switch (settings.release_type) {
      case 'immediate':
        return null;

      case 'days_after_purchase':
        if (settings.days_after_purchase) {
          const unlockDate = new Date(purchase);
          unlockDate.setDate(unlockDate.getDate() + settings.days_after_purchase);
          return unlockDate;
        }
        return null;

      case 'fixed_date':
        if (settings.fixed_date) {
          return new Date(settings.fixed_date);
        }
        return null;

      case 'after_content':
        return null;

      default:
        return null;
    }
  }, []);

  /**
   * Check if a specific content is accessible for a buyer via Edge Function
   * MIGRATED: Uses supabase.functions.invoke instead of supabase.from()
   */
  const checkContentAccess = useCallback(async (
    contentId: string,
    buyerId: string,
    purchaseDate: string
  ): Promise<ContentAccessStatus> => {
    try {
      const { data, error } = await api.call<ContentAccessStatus>("admin-data", {
        action: "content-access-check",
        contentId,
        buyerId,
        purchaseDate,
      });

      if (error) throw new Error(error.message);

      return data as ContentAccessStatus;
    } catch (error) {
      log.error("Error checking access:", error);
      return {
        content_id: contentId,
        is_accessible: true,
        unlock_date: null,
        reason: 'available',
      };
    }
  }, []);

  return {
    isLoading,
    checkContentAccess,
    getDripSettings,
    calculateUnlockDate,
  };
}
