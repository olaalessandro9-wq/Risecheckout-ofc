/**
 * Order Status Service Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for status operations:
 * - Display label generation
 * - Color scheme retrieval
 * - Status normalization (gateway mapping)
 * - Validation
 * 
 * 5 STATUS CANÔNICOS: paid, pending, refused, refunded, chargeback
 */

import { describe, it, expect } from "vitest";
import { orderStatusService } from "../service";
import { CANONICAL_STATUSES, STATUS_DISPLAY_MAP, STATUS_COLORS } from "../types";

describe("OrderStatusService", () => {
  // ========== GET DISPLAY LABEL ==========

  describe("getDisplayLabel", () => {
    it("should return 'Pago' for paid status", () => {
      expect(orderStatusService.getDisplayLabel("paid")).toBe("Pago");
    });

    it("should return 'Pendente' for pending status", () => {
      expect(orderStatusService.getDisplayLabel("pending")).toBe("Pendente");
    });

    it("should return 'Recusado' for refused status (cartão recusado)", () => {
      expect(orderStatusService.getDisplayLabel("refused")).toBe("Recusado");
    });

    it("should return 'Reembolso' for refunded status", () => {
      expect(orderStatusService.getDisplayLabel("refunded")).toBe("Reembolso");
    });

    it("should return 'Chargeback' for chargeback status", () => {
      expect(orderStatusService.getDisplayLabel("chargeback")).toBe("Chargeback");
    });

    it("should return 'Pendente' for null status", () => {
      expect(orderStatusService.getDisplayLabel(null)).toBe("Pendente");
    });

    it("should return 'Pendente' for undefined status", () => {
      expect(orderStatusService.getDisplayLabel(undefined)).toBe("Pendente");
    });

    it("should return 'Pago' for gateway 'approved' status", () => {
      expect(orderStatusService.getDisplayLabel("approved")).toBe("Pago");
    });

    it("should return 'Pendente' for expired status (padrão mercado)", () => {
      expect(orderStatusService.getDisplayLabel("expired")).toBe("Pendente");
    });

    it("should return 'Pendente' for cancelled status (padrão mercado)", () => {
      expect(orderStatusService.getDisplayLabel("cancelled")).toBe("Pendente");
    });

    it("should return 'Recusado' for failed status (cartão recusado)", () => {
      expect(orderStatusService.getDisplayLabel("failed")).toBe("Recusado");
    });

    it("should return 'Recusado' for rejected status (cartão recusado)", () => {
      expect(orderStatusService.getDisplayLabel("rejected")).toBe("Recusado");
    });

    it("should return 'Recusado' for declined status (cartão recusado)", () => {
      expect(orderStatusService.getDisplayLabel("declined")).toBe("Recusado");
    });

    it("should return 'Pendente' for unknown status", () => {
      expect(orderStatusService.getDisplayLabel("xyz_unknown")).toBe("Pendente");
    });

    it("should handle case-insensitive status", () => {
      expect(orderStatusService.getDisplayLabel("PAID")).toBe("Pago");
      expect(orderStatusService.getDisplayLabel("Pending")).toBe("Pendente");
      expect(orderStatusService.getDisplayLabel("REFUSED")).toBe("Recusado");
    });
  });

  // ========== GET COLOR SCHEME ==========

  describe("getColorScheme", () => {
    it("should return green scheme for paid", () => {
      const colors = orderStatusService.getColorScheme("paid");
      expect(colors.bg).toContain("emerald");
      expect(colors.text).toContain("emerald");
    });

    it("should return amber scheme for pending", () => {
      const colors = orderStatusService.getColorScheme("pending");
      expect(colors.bg).toContain("amber");
      expect(colors.text).toContain("amber");
    });

    it("should return red scheme for refused (cartão recusado)", () => {
      const colors = orderStatusService.getColorScheme("refused");
      expect(colors.bg).toContain("red");
      expect(colors.text).toContain("red");
    });

    it("should return red scheme for refunded", () => {
      const colors = orderStatusService.getColorScheme("refunded");
      expect(colors.bg).toContain("red");
      expect(colors.text).toContain("red");
    });

    it("should return red scheme for chargeback", () => {
      const colors = orderStatusService.getColorScheme("chargeback");
      expect(colors.bg).toContain("red");
      expect(colors.text).toContain("red");
    });

    it("should return pending colors for null status", () => {
      const colors = orderStatusService.getColorScheme(null);
      expect(colors).toEqual(STATUS_COLORS.pending);
    });

    it("should return pending colors for undefined status", () => {
      const colors = orderStatusService.getColorScheme(undefined);
      expect(colors).toEqual(STATUS_COLORS.pending);
    });

    it("should return pending colors for unknown status", () => {
      const colors = orderStatusService.getColorScheme("unknown_status");
      expect(colors).toEqual(STATUS_COLORS.pending);
    });
  });

  // ========== NORMALIZE ==========

  describe("normalize", () => {
    describe("Canonical status passthrough", () => {
      it.each(CANONICAL_STATUSES)("should pass through canonical status: %s", (status) => {
        expect(orderStatusService.normalize(status)).toBe(status);
      });
    });

    describe("Success mappings → paid", () => {
      const successStatuses = ["approved", "succeeded", "success", "complete", "completed", "confirmed"];
      
      it.each(successStatuses)("should map %s to paid", (status) => {
        expect(orderStatusService.normalize(status)).toBe("paid");
      });
    });

    describe("Pending mappings → pending", () => {
      const pendingStatuses = [
        "authorized", "in_process", "in_mediation", "created",
        "requires_payment_method", "requires_confirmation", "requires_action",
        "processing", "requires_capture",
      ];
      
      it.each(pendingStatuses)("should map %s to pending", (status) => {
        expect(orderStatusService.normalize(status)).toBe("pending");
      });
    });

    describe("Expired/Cancelled mappings → pending (padrão mercado)", () => {
      const expiredStatuses = [
        "expired", "cancelled", "canceled", "cancelled_by_user",
        "timeout", "expired_pix", "abandoned",
      ];
      
      it.each(expiredStatuses)("should map %s to pending (padrão mercado)", (status) => {
        expect(orderStatusService.normalize(status)).toBe("pending");
      });
    });

    describe("Failed/Rejected mappings → refused (cartão recusado)", () => {
      const refusedStatuses = ["failed", "rejected", "error", "declined", "refused", "card_declined", "cc_rejected"];
      
      it.each(refusedStatuses)("should map %s to refused", (status) => {
        expect(orderStatusService.normalize(status)).toBe("refused");
      });
    });

    describe("Chargeback mappings → chargeback", () => {
      const chargebackStatuses = ["dispute", "disputed", "chargedback", "charged_back"];
      
      it.each(chargebackStatuses)("should map %s to chargeback", (status) => {
        expect(orderStatusService.normalize(status)).toBe("chargeback");
      });
    });

    it("should return pending for null", () => {
      expect(orderStatusService.normalize(null)).toBe("pending");
    });

    it("should return pending for undefined", () => {
      expect(orderStatusService.normalize(undefined)).toBe("pending");
    });

    it("should return pending for empty string", () => {
      expect(orderStatusService.normalize("")).toBe("pending");
    });

    it("should handle whitespace in status", () => {
      expect(orderStatusService.normalize("  paid  ")).toBe("paid");
    });
  });

  // ========== IS PAID ==========

  describe("isPaid", () => {
    it("should return true for paid", () => {
      expect(orderStatusService.isPaid("paid")).toBe(true);
    });

    it("should return true for approved (gateway)", () => {
      expect(orderStatusService.isPaid("approved")).toBe(true);
    });

    it("should return false for pending", () => {
      expect(orderStatusService.isPaid("pending")).toBe(false);
    });

    it("should return false for refused", () => {
      expect(orderStatusService.isPaid("refused")).toBe(false);
    });

    it("should return false for refunded", () => {
      expect(orderStatusService.isPaid("refunded")).toBe(false);
    });

    it("should return false for null", () => {
      expect(orderStatusService.isPaid(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(orderStatusService.isPaid(undefined)).toBe(false);
    });
  });

  // ========== IS PENDING ==========

  describe("isPending", () => {
    it("should return true for pending", () => {
      expect(orderStatusService.isPending("pending")).toBe(true);
    });

    it("should return true for expired (padrão mercado)", () => {
      expect(orderStatusService.isPending("expired")).toBe(true);
    });

    it("should return false for failed (cartão recusado não é pending)", () => {
      expect(orderStatusService.isPending("failed")).toBe(false);
    });

    it("should return false for rejected (cartão recusado não é pending)", () => {
      expect(orderStatusService.isPending("rejected")).toBe(false);
    });

    it("should return false for paid", () => {
      expect(orderStatusService.isPending("paid")).toBe(false);
    });

    it("should return false for refused", () => {
      expect(orderStatusService.isPending("refused")).toBe(false);
    });

    it("should return true for null (defaults to pending)", () => {
      expect(orderStatusService.isPending(null)).toBe(true);
    });

    it("should return true for undefined (defaults to pending)", () => {
      expect(orderStatusService.isPending(undefined)).toBe(true);
    });
  });

  // ========== IS REFUSED ==========

  describe("isRefused", () => {
    it("should return true for refused", () => {
      expect(orderStatusService.isRefused("refused")).toBe(true);
    });

    it("should return true for rejected (gateway)", () => {
      expect(orderStatusService.isRefused("rejected")).toBe(true);
    });

    it("should return true for declined (gateway)", () => {
      expect(orderStatusService.isRefused("declined")).toBe(true);
    });

    it("should return true for failed (gateway)", () => {
      expect(orderStatusService.isRefused("failed")).toBe(true);
    });

    it("should return true for card_declined (gateway)", () => {
      expect(orderStatusService.isRefused("card_declined")).toBe(true);
    });

    it("should return true for cc_rejected (gateway)", () => {
      expect(orderStatusService.isRefused("cc_rejected")).toBe(true);
    });

    it("should return true for error (gateway)", () => {
      expect(orderStatusService.isRefused("error")).toBe(true);
    });

    it("should return false for paid", () => {
      expect(orderStatusService.isRefused("paid")).toBe(false);
    });

    it("should return false for pending", () => {
      expect(orderStatusService.isRefused("pending")).toBe(false);
    });

    it("should return false for null", () => {
      expect(orderStatusService.isRefused(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(orderStatusService.isRefused(undefined)).toBe(false);
    });
  });

  // ========== IS TERMINAL ==========

  describe("isTerminal", () => {
    it("should return true for paid", () => {
      expect(orderStatusService.isTerminal("paid")).toBe(true);
    });

    it("should return true for refunded", () => {
      expect(orderStatusService.isTerminal("refunded")).toBe(true);
    });

    it("should return true for chargeback", () => {
      expect(orderStatusService.isTerminal("chargeback")).toBe(true);
    });

    it("should return false for pending (can still become paid)", () => {
      expect(orderStatusService.isTerminal("pending")).toBe(false);
    });

    it("should return false for refused (can retry with another card)", () => {
      expect(orderStatusService.isTerminal("refused")).toBe(false);
    });

    it("should return false for null (normalizes to pending)", () => {
      expect(orderStatusService.isTerminal(null)).toBe(false);
    });

    it("should return false for undefined (normalizes to pending)", () => {
      expect(orderStatusService.isTerminal(undefined)).toBe(false);
    });
  });

  // ========== VALIDATE ==========

  describe("validate", () => {
    it("should not throw for valid canonical status", () => {
      expect(() => orderStatusService.validate("paid")).not.toThrow();
      expect(() => orderStatusService.validate("pending")).not.toThrow();
      expect(() => orderStatusService.validate("refused")).not.toThrow();
      expect(() => orderStatusService.validate("refunded")).not.toThrow();
      expect(() => orderStatusService.validate("chargeback")).not.toThrow();
    });

    it("should throw for non-canonical status", () => {
      expect(() => orderStatusService.validate("approved")).toThrow();
      expect(() => orderStatusService.validate("unknown")).toThrow();
    });

    it("should throw for null", () => {
      expect(() => orderStatusService.validate(null)).toThrow();
    });

    it("should throw for undefined", () => {
      expect(() => orderStatusService.validate(undefined)).toThrow();
    });

    it("should throw for number", () => {
      expect(() => orderStatusService.validate(123)).toThrow();
    });

    it("should throw for object", () => {
      expect(() => orderStatusService.validate({})).toThrow();
    });
  });

  // ========== GET ALL STATUSES ==========

  describe("getAllStatuses", () => {
    it("should return all 5 canonical statuses", () => {
      const statuses = orderStatusService.getAllStatuses();
      expect(statuses).toEqual(CANONICAL_STATUSES);
      expect(statuses).toHaveLength(5);
    });

    it("should include refused status", () => {
      const statuses = orderStatusService.getAllStatuses();
      expect(statuses).toContain("refused");
    });
  });

  // ========== GET STATUS OPTIONS ==========

  describe("getStatusOptions", () => {
    it("should return options with value and label", () => {
      const options = orderStatusService.getStatusOptions();
      
      expect(options).toHaveLength(5);
      expect(options[0]).toHaveProperty("value");
      expect(options[0]).toHaveProperty("label");
    });

    it("should have correct labels for all statuses", () => {
      const options = orderStatusService.getStatusOptions();
      
      expect(options.find(o => o.value === "paid")?.label).toBe("Pago");
      expect(options.find(o => o.value === "pending")?.label).toBe("Pendente");
      expect(options.find(o => o.value === "refused")?.label).toBe("Recusado");
      expect(options.find(o => o.value === "refunded")?.label).toBe("Reembolso");
      expect(options.find(o => o.value === "chargeback")?.label).toBe("Chargeback");
    });

    it("should return all canonical statuses as options", () => {
      const options = orderStatusService.getStatusOptions();
      const values = options.map(o => o.value);
      
      expect(values).toEqual(CANONICAL_STATUSES);
    });
  });
});
