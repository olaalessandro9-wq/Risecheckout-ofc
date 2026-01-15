/**
 * useVisitTracker
 * 
 * Hook para rastrear visitas ao checkout.
 * Insere registro em checkout_visits uma única vez por sessão.
 * 
 * @version 1.0.0 - RISE Protocol V2
 */

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tracks a checkout visit once per session
 * Uses sessionStorage to prevent duplicate tracking
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
        const { error } = await supabase.functions.invoke("track-visit", {
          body: {
            checkoutId,
            userAgent: navigator.userAgent,
            referrer: document.referrer || null,
            utmSource: urlParams.get("utm_source"),
            utmMedium: urlParams.get("utm_medium"),
            utmCampaign: urlParams.get("utm_campaign"),
            utmContent: urlParams.get("utm_content"),
            utmTerm: urlParams.get("utm_term"),
          },
        });

        if (error) {
          console.warn("[useVisitTracker] Edge function error:", error);
          // Fallback: insert directly (without IP)
          await supabase.from("checkout_visits").insert({
            checkout_id: checkoutId,
            user_agent: navigator.userAgent,
            referrer: document.referrer || null,
            utm_source: urlParams.get("utm_source"),
            utm_medium: urlParams.get("utm_medium"),
            utm_campaign: urlParams.get("utm_campaign"),
            utm_content: urlParams.get("utm_content"),
            utm_term: urlParams.get("utm_term"),
          });
        }

        // Mark as tracked in session
        sessionStorage.setItem(sessionKey, "true");
        hasTracked.current = true;

        console.log("[useVisitTracker] Visit tracked for checkout:", checkoutId);
      } catch (err) {
        console.error("[useVisitTracker] Error tracking visit:", err);
      }
    };

    trackVisit();
  }, [checkoutId]);
}
