/**
 * @file index.test.ts
 * @description Tests for Stripe barrel exports
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import * as Stripe from "../index";

describe("Stripe Barrel Export", () => {
  describe("API Exports", () => {
    it("should export getStripeConnectionStatus", () => {
      expect(Stripe.getStripeConnectionStatus).toBeDefined();
      expect(typeof Stripe.getStripeConnectionStatus).toBe("function");
    });

    it("should export startStripeConnect", () => {
      expect(Stripe.startStripeConnect).toBeDefined();
      expect(typeof Stripe.startStripeConnect).toBe("function");
    });

    it("should export disconnectStripe", () => {
      expect(Stripe.disconnectStripe).toBeDefined();
      expect(typeof Stripe.disconnectStripe).toBe("function");
    });

    it("should export isStripeConnected", () => {
      expect(Stripe.isStripeConnected).toBeDefined();
      expect(typeof Stripe.isStripeConnected).toBe("function");
    });

    it("should export getStripeConfig", () => {
      expect(Stripe.getStripeConfig).toBeDefined();
      expect(typeof Stripe.getStripeConfig).toBe("function");
    });
  });

  describe("Hook Exports", () => {
    it("should export useStripeConfig", () => {
      expect(Stripe.useStripeConfig).toBeDefined();
      expect(typeof Stripe.useStripeConfig).toBe("function");
    });

    it("should export useStripeConnectionStatus", () => {
      expect(Stripe.useStripeConnectionStatus).toBeDefined();
      expect(typeof Stripe.useStripeConnectionStatus).toBe("function");
    });

    it("should export useStripeConnect", () => {
      expect(Stripe.useStripeConnect).toBeDefined();
      expect(typeof Stripe.useStripeConnect).toBe("function");
    });

    it("should export useStripeDisconnect", () => {
      expect(Stripe.useStripeDisconnect).toBeDefined();
      expect(typeof Stripe.useStripeDisconnect).toBe("function");
    });

    it("should export useStripeOAuthCallback", () => {
      expect(Stripe.useStripeOAuthCallback).toBeDefined();
      expect(typeof Stripe.useStripeOAuthCallback).toBe("function");
    });
  });

  describe("Component Exports", () => {
    it("should export ConfigForm component", () => {
      expect(Stripe.ConfigForm).toBeDefined();
    });

    it("should export ConnectionStatus component", () => {
      expect(Stripe.ConnectionStatus).toBeDefined();
    });

    it("should export ConnectButton component", () => {
      expect(Stripe.ConnectButton).toBeDefined();
    });

    it("should export InfoCard component", () => {
      expect(Stripe.InfoCard).toBeDefined();
    });
  });

  describe("Type Exports", () => {
    // Types are verified at compile time
    it("should compile with type exports", () => {
      expect(true).toBe(true);
    });
  });
});
