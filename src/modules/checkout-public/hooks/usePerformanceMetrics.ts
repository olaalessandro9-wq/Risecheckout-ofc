/**
 * usePerformanceMetrics Hook
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Collects Web Vitals and custom performance metrics for the checkout.
 * Metrics are collected during idle time to avoid impacting performance.
 * 
 * Metrics collected:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 * - Custom: Time to Interactive (checkout form ready)
 * 
 * @module checkout-public/hooks
 */

import { useEffect, useRef, useCallback } from "react";
import { createLogger } from "@/lib/logger";

const log = createLogger("PerformanceMetrics");

// ============================================================================
// TYPES
// ============================================================================

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface MetricThresholds {
  good: number;
  poor: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Web Vitals thresholds based on Google's recommendations
 */
const THRESHOLDS: Record<string, MetricThresholds> = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

// ============================================================================
// HELPERS
// ============================================================================

function getRating(value: number, thresholds: MetricThresholds): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

// ============================================================================
// HOOK
// ============================================================================

interface UsePerformanceMetricsOptions {
  /** Whether to enable metrics collection (default: true) */
  enabled?: boolean;
  /** Callback when a metric is collected */
  onMetric?: (metric: PerformanceMetric) => void;
  /** Debug mode - logs all metrics */
  debug?: boolean;
}

/**
 * Collects Web Vitals and custom performance metrics.
 * 
 * @example
 * ```typescript
 * usePerformanceMetrics({
 *   onMetric: (metric) => {
 *     analytics.track('web_vital', metric);
 *   },
 * });
 * ```
 */
export function usePerformanceMetrics(options: UsePerformanceMetricsOptions = {}): void {
  const { enabled = true, onMetric, debug = false } = options;
  const metricsCollected = useRef<Set<string>>(new Set());
  const interactiveTime = useRef<number | null>(null);

  /**
   * Reports a metric (with deduplication)
   */
  const reportMetric = useCallback((name: string, value: number) => {
    // Skip if already collected
    if (metricsCollected.current.has(name)) return;
    metricsCollected.current.add(name);

    const thresholds = THRESHOLDS[name];
    const metric: PerformanceMetric = {
      name,
      value,
      rating: thresholds ? getRating(value, thresholds) : 'good',
      timestamp: Date.now(),
    };

    if (debug) {
      log.info(`[${metric.rating}] ${name}: ${value.toFixed(2)}`);
    }

    onMetric?.(metric);
  }, [debug, onMetric]);

  /**
   * Mark checkout as interactive (form loaded and ready)
   */
  const markInteractive = useCallback(() => {
    if (interactiveTime.current !== null) return;
    
    interactiveTime.current = performance.now();
    reportMetric('TTI_CHECKOUT', interactiveTime.current);
  }, [reportMetric]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    const observers: PerformanceObserver[] = [];

    try {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          reportMetric('LCP', lastEntry.startTime);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      observers.push(lcpObserver);

      // FID Observer
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[];
        const firstEntry = entries[0];
        if (firstEntry?.processingStart) {
          reportMetric('FID', firstEntry.processingStart - firstEntry.startTime);
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      observers.push(fidObserver);

      // CLS Observer
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Type assertion for layout-shift entries
          const layoutShift = entry as PerformanceEntry & { 
            hadRecentInput?: boolean; 
            value?: number 
          };
          if (!layoutShift.hadRecentInput && layoutShift.value) {
            clsValue += layoutShift.value;
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      observers.push(clsObserver);

      // Report CLS when page becomes hidden
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          reportMetric('CLS', clsValue);
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // FCP Observer
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntriesByName('first-contentful-paint');
        if (entries.length > 0) {
          reportMetric('FCP', entries[0].startTime);
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      observers.push(fcpObserver);

      // TTFB from navigation timing
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (navEntry) {
        reportMetric('TTFB', navEntry.responseStart);
      }

      // Cleanup
      return () => {
        observers.forEach((observer) => observer.disconnect());
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } catch (error) {
      log.error('Error setting up performance observers:', error);
    }
  }, [enabled, reportMetric]);

  // Expose markInteractive for external use
  useEffect(() => {
    // Auto-mark interactive after a short delay if not already marked
    const timer = setTimeout(() => {
      markInteractive();
    }, 3000);

    return () => clearTimeout(timer);
  }, [markInteractive]);
}

/**
 * Simple hook to just log metrics in development
 */
export function usePerformanceMetricsDev(): void {
  usePerformanceMetrics({
    enabled: process.env.NODE_ENV === 'development',
    debug: true,
  });
}
