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

    it("should return 'Pendente' for failed status (padrão mercado)", () => {
      expect(orderStatusService.getDisplayLabel("failed")).toBe("Pendente");
    });

    it("should return 'Pendente' for unknown status", () => {
      expect(orderStatusService.getDisplayLabel("xyz_unknown")).toBe("Pendente");
    });

    it("should handle case-insensitive status", () => {
      expect(orderStatusService.getDisplayLabel("PAID")).toBe("Pago");
      expect(orderStatusService.getDisplayLabel("Pending")).toBe("Pendente");
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

    it("should return blue scheme for refunded", () => {
      const colors = orderStatusService.getColorScheme("refunded");
      expect(colors.bg).toContain("blue");
      expect(colors.text).toContain("blue");
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

    describe("Failed/Rejected mappings → pending (padrão mercado)", () => {
      const failedStatuses = ["failed", "rejected", "error", "declined"];
      
      it.each(failedStatuses)("should map %s to pending (padrão mercado)", (status) => {
        expect(orderStatusService.normalize(status)).toBe("pending");
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

    it("should return false for refunded", () => {
      expect(orderStatusService.isPaid("refunded")).toBe(false);
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

    it("should return true for failed (padrão mercado)", () => {
      expect(orderStatusService.isPending("failed")).toBe(true);
    });

    it("should return false for paid", () => {
      expect(orderStatusService.isPending("paid")).toBe(false);
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
  });

  // ========== VALIDATE ==========

  describe("validate", () => {
    it("should not throw for valid canonical status", () => {
      expect(() => orderStatusService.validate("paid")).not.toThrow();
      expect(() => orderStatusService.validate("pending")).not.toThrow();
    });

    it("should throw for non-canonical status", () => {
      expect(() => orderStatusService.validate("approved")).toThrow();
      expect(() => orderStatusService.validate("unknown")).toThrow();
    });

    it("should throw for null", () => {
      expect(() => orderStatusService.validate(null)).toThrow();
    });
  });

  // ========== GET ALL STATUSES ==========

  describe("getAllStatuses", () => {
    it("should return all canonical statuses", () => {
      const statuses = orderStatusService.getAllStatuses();
      expect(statuses).toEqual(CANONICAL_STATUSES);
      expect(statuses).toHaveLength(4);
    });
  });

  // ========== GET STATUS OPTIONS ==========

  describe("getStatusOptions", () => {
    it("should return options with value and label", () => {
      const options = orderStatusService.getStatusOptions();
      
      expect(options).toHaveLength(4);
      expect(options[0]).toHaveProperty("value");
      expect(options[0]).toHaveProperty("label");
    });

    it("should have correct labels", () => {
      const options = orderStatusService.getStatusOptions();
      const paidOption = options.find(o => o.value === "paid");
      
      expect(paidOption?.label).toBe("Pago");
    });
  });
});
