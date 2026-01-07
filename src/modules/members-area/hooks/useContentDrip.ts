/**
 * useContentDrip Hook
 * Handles drip content release logic
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
   * Get all drip settings for a product's contents
   */
  const getDripSettings = useCallback(async (
    productId: string
  ): Promise<Map<string, ContentReleaseSettings>> => {
    setIsLoading(true);

    const settingsMap = new Map<string, ContentReleaseSettings>();

    const { data: modules } = await supabase
      .from('product_member_modules')
      .select('id')
      .eq('product_id', productId);

    if (!modules?.length) {
      setIsLoading(false);
      return settingsMap;
    }

    const moduleIds = modules.map(m => m.id);

    const { data: contents } = await supabase
      .from('product_member_content')
      .select('id')
      .in('module_id', moduleIds);

    if (!contents?.length) {
      setIsLoading(false);
      return settingsMap;
    }

    const contentIds = contents.map(c => c.id);

    const { data: settings } = await supabase
      .from('content_release_settings')
      .select('*')
      .in('content_id', contentIds);

    if (settings) {
      settings.forEach(s => {
        settingsMap.set(s.content_id, {
          id: s.id,
          content_id: s.content_id,
          release_type: s.release_type as ReleaseType,
          days_after_purchase: s.days_after_purchase,
          fixed_date: s.fixed_date,
          after_content_id: s.after_content_id,
        });
      });
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
        return null; // Already available

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
        // This requires checking if previous content is completed
        // Handled separately in checkContentAccess
        return null;

      default:
        return null;
    }
  }, []);

  /**
   * Check if a specific content is accessible for a buyer
   */
  const checkContentAccess = useCallback(async (
    contentId: string,
    buyerId: string,
    purchaseDate: string
  ): Promise<ContentAccessStatus> => {
    // Get release settings for this content
    const { data: settings } = await supabase
      .from('content_release_settings')
      .select('*')
      .eq('content_id', contentId)
      .single();

    // No settings means immediate release
    if (!settings) {
      return {
        content_id: contentId,
        is_accessible: true,
        unlock_date: null,
        reason: 'available',
      };
    }

    const releaseSettings: ContentReleaseSettings = {
      id: settings.id,
      content_id: settings.content_id,
      release_type: settings.release_type as ReleaseType,
      days_after_purchase: settings.days_after_purchase,
      fixed_date: settings.fixed_date,
      after_content_id: settings.after_content_id,
    };
    
    const now = new Date();

    // Handle "after_content" type - check if prerequisite is completed
    if (releaseSettings.release_type === 'after_content' && releaseSettings.after_content_id) {
      const { data: progress } = await supabase
        .from('buyer_content_progress')
        .select('completed_at')
        .eq('buyer_id', buyerId)
        .eq('content_id', releaseSettings.after_content_id)
        .single();

      if (!progress?.completed_at) {
        return {
          content_id: contentId,
          is_accessible: false,
          unlock_date: null,
          reason: 'drip_locked',
        };
      }

      return {
        content_id: contentId,
        is_accessible: true,
        unlock_date: null,
        reason: 'available',
      };
    }

    // Calculate unlock date for time-based releases
    const unlockDate = calculateUnlockDate(releaseSettings, purchaseDate);

    if (!unlockDate) {
      return {
        content_id: contentId,
        is_accessible: true,
        unlock_date: null,
        reason: 'available',
      };
    }

    if (now >= unlockDate) {
      return {
        content_id: contentId,
        is_accessible: true,
        unlock_date: unlockDate.toISOString(),
        reason: 'available',
      };
    }

    return {
      content_id: contentId,
      is_accessible: false,
      unlock_date: unlockDate.toISOString(),
      reason: 'drip_locked',
    };
  }, [calculateUnlockDate]);

  return {
    isLoading,
    checkContentAccess,
    getDripSettings,
    calculateUnlockDate,
  };
}
