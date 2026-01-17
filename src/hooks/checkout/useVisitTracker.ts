/**
 * useVisitTracker
 * 
 * Hook para rastrear visitas ao checkout.
 * Insere registro em checkout_visits via Edge Function.
 * 
 * MIGRATED: Uses api.publicCall() instead of supabase.functions.invoke()
 * 
 * @version 2.0.0 - RISE Protocol V2
 */

import { useEffect, useRef } from "react";
import { api } from "@/lib/api";

/**
 * Tracks a checkout visit once per session
 * Uses sessionStorage to prevent duplicate tracking
 * 
 * ZERO FALLBACK: Se a Edge Function falhar, NÃO tenta acesso direto ao banco
 */
export function useVisitTracker(checkoutId: string | undefined): void {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!checkoutId || hasTracked.current) return;

    // v2: Nova chave para garantir tracking após reset de dados
    const sessionKey = `visit_tracked_v2_${checkoutId}`;
    
    // Prevent duplicate tracking in same session
    if (sessionStorage.getItem(sessionKey)) {
      hasTracked.current = true;
      return;
    }

    const trackVisit = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Call edge function to track visit (captures IP server-side)
        const { error } = await api.publicCall("track-visit", {
          checkoutId,
          userAgent: navigator.userAgent,
          referrer: document.referrer || null,
          utmSource: urlParams.get("utm_source"),
          utmMedium: urlParams.get("utm_medium"),
          utmCampaign: urlParams.get("utm_campaign"),
          utmContent: urlParams.get("utm_content"),
          utmTerm: urlParams.get("utm_term"),
        });

        if (error) {
          // Log error but do NOT fallback to direct database access
          console.error("[useVisitTracker] Edge function error:", error);
          // Still mark as tracked to prevent infinite retries
          sessionStorage.setItem(sessionKey, "failed");
          hasTracked.current = true;
          return;
        }

        // Mark as tracked in session
        sessionStorage.setItem(sessionKey, "true");
        hasTracked.current = true;

        console.log("[useVisitTracker] Visit tracked for checkout:", checkoutId);
      } catch (err) {
        console.error("[useVisitTracker] Error tracking visit:", err);
        // Mark as attempted to prevent infinite retries
        hasTracked.current = true;
      }
    };

    trackVisit();
  }, [checkoutId]);
}
