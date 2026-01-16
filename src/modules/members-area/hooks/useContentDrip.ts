/**
 * useContentDrip Hook
 * 
 * MIGRATED: Uses Edge Function instead of supabase.from()
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getProducerSessionToken } from '@/hooks/useProducerAuth';
import type { ContentReleaseSettings, ContentAccessStatus, ReleaseType } from '../types';

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
      const sessionToken = getProducerSessionToken();
      
      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: {
          action: "content-drip-settings",
          productId,
        },
        headers: { "x-producer-session-token": sessionToken || "" },
      });

      if (error) throw error;

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
      console.error("[useContentDrip] Error fetching settings:", error);
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
      const sessionToken = getProducerSessionToken();
      
      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: {
          action: "content-access-check",
          contentId,
          buyerId,
          purchaseDate,
        },
        headers: { "x-producer-session-token": sessionToken || "" },
      });

      if (error) throw error;

      return data as ContentAccessStatus;
    } catch (error) {
      console.error("[useContentDrip] Error checking access:", error);
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
