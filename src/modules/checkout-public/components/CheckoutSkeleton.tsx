/**
 * CheckoutSkeleton Component
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Instant visual feedback while checkout data loads.
 * Renders IMMEDIATELY (0ms) to eliminate perceived latency.
 * 
 * Design matches the real checkout layout for seamless transition.
 * 
 * @module checkout-public/components
 */

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const CheckoutSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-muted">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="max-w-lg mx-auto p-4 space-y-4">
          {/* Product Card Skeleton */}
          <div className="bg-card rounded-xl p-4 space-y-3">
            <div className="flex gap-3">
              <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>

          {/* Form Section Skeleton */}
          <div className="bg-card rounded-xl p-4 space-y-4">
            <Skeleton className="h-6 w-48" />
            
            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Skeleton className="h-4 w-12 mb-2" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Skeleton */}
          <div className="bg-card rounded-xl p-4 space-y-4">
            <Skeleton className="h-6 w-40" />
            
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          </div>

          {/* Submit Button Skeleton */}
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-5 gap-6">
            {/* Left Column - Form */}
            <div className="col-span-3 space-y-6">
              {/* Form Card */}
              <div className="bg-card rounded-xl p-6 space-y-6">
                <Skeleton className="h-7 w-56" />
                
                {/* Form Grid */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-11 w-full rounded-lg" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-11 w-full rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-11 w-full rounded-lg" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Skeleton className="h-4 w-12 mb-2" />
                      <Skeleton className="h-11 w-full rounded-lg" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-11 w-full rounded-lg" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-11 w-full rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Card */}
              <div className="bg-card rounded-xl p-6 space-y-4">
                <Skeleton className="h-6 w-48" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="col-span-2 space-y-6">
              {/* Product Summary */}
              <div className="bg-card rounded-xl p-6 space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-6 w-28" />
                  </div>
                </div>
              </div>

              {/* Order Bumps Skeleton */}
              <div className="bg-card rounded-xl p-6 space-y-3">
                <Skeleton className="h-5 w-36" />
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              </div>

              {/* Submit Button */}
              <Skeleton className="h-14 w-full rounded-xl" />

              {/* Trust Badges */}
              <div className="flex justify-center gap-4">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
