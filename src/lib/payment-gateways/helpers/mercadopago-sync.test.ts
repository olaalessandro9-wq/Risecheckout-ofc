/**
 * MercadoPago Sync Helpers Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests DOM synchronization helpers for MercadoPago SDK integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  syncMercadoPagoHiddenFields,
  updateMercadoPagoInstallmentsSelect,
  type MercadoPagoSyncData,
} from "./mercadopago-sync";

describe("MercadoPago Sync Helpers", () => {
  // Setup DOM elements before each test
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="form-checkout__identificationNumber" type="hidden" />
      <select id="form-checkout__identificationType">
        <option value="CPF">CPF</option>
        <option value="CNPJ">CNPJ</option>
      </select>
      <input id="form-checkout__cardholderName" type="hidden" />
      <select id="form-checkout__installments"></select>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  // ============================================================================
  // syncMercadoPagoHiddenFields
  // ============================================================================

  describe("syncMercadoPagoHiddenFields", () => {
    it("should sync cardholderName to hidden field", () => {
      const data: MercadoPagoSyncData = {
        cardholderName: "João Silva",
        cardholderDocument: "123.456.789-00",
        installments: 3,
      };

      syncMercadoPagoHiddenFields(data);

      const hiddenName = document.getElementById(
        "form-checkout__cardholderName"
      ) as HTMLInputElement;
      expect(hiddenName.value).toBe("João Silva");
    });

    it("should sync document with mask removed", () => {
      const data: MercadoPagoSyncData = {
        cardholderName: "Test",
        cardholderDocument: "123.456.789-00",
        installments: 1,
      };

      syncMercadoPagoHiddenFields(data);

      const hiddenDoc = document.getElementById(
        "form-checkout__identificationNumber"
      ) as HTMLInputElement;
      expect(hiddenDoc.value).toBe("12345678900");
    });

    it("should detect CPF correctly (11 digits)", () => {
      const data: MercadoPagoSyncData = {
        cardholderName: "Test",
        cardholderDocument: "123.456.789-00", // 11 digits
        installments: 1,
      };

      syncMercadoPagoHiddenFields(data);

      const hiddenType = document.getElementById(
        "form-checkout__identificationType"
      ) as HTMLSelectElement;
      expect(hiddenType.value).toBe("CPF");
    });

    it("should detect CNPJ correctly (14 digits)", () => {
      const data: MercadoPagoSyncData = {
        cardholderName: "Test",
        cardholderDocument: "12.345.678/0001-00", // 14 digits
        installments: 1,
      };

      syncMercadoPagoHiddenFields(data);

      const hiddenType = document.getElementById(
        "form-checkout__identificationType"
      ) as HTMLSelectElement;
      expect(hiddenType.value).toBe("CNPJ");
    });

    it("should dispatch input events", () => {
      const data: MercadoPagoSyncData = {
        cardholderName: "Test",
        cardholderDocument: "12345678900",
        installments: 1,
      };

      const dispatchEventSpy = vi.spyOn(HTMLInputElement.prototype, "dispatchEvent");

      syncMercadoPagoHiddenFields(data);

      // Should have dispatched events for doc and name fields
      expect(dispatchEventSpy).toHaveBeenCalled();
    });

    it("should handle missing DOM elements gracefully", () => {
      // Remove all elements
      document.body.innerHTML = "";

      const data: MercadoPagoSyncData = {
        cardholderName: "Test",
        cardholderDocument: "12345678900",
        installments: 1,
      };

      // Should not throw
      expect(() => syncMercadoPagoHiddenFields(data)).not.toThrow();
    });

    it("should sync installments value", () => {
      // Add some options first
      const select = document.getElementById(
        "form-checkout__installments"
      ) as HTMLSelectElement;
      select.innerHTML = `
        <option value="1">1x</option>
        <option value="3">3x</option>
        <option value="6">6x</option>
      `;

      const data: MercadoPagoSyncData = {
        cardholderName: "Test",
        cardholderDocument: "12345678900",
        installments: 3,
      };

      syncMercadoPagoHiddenFields(data);

      expect(select.value).toBe("3");
    });
  });

  // ============================================================================
  // updateMercadoPagoInstallmentsSelect
  // ============================================================================

  describe("updateMercadoPagoInstallmentsSelect", () => {
    it("should clear existing options", () => {
      const select = document.getElementById(
        "form-checkout__installments"
      ) as HTMLSelectElement;
      select.innerHTML = `
        <option value="1">1x</option>
        <option value="2">2x</option>
      `;

      updateMercadoPagoInstallmentsSelect([{ installments: 1 }], 1);

      expect(select.options.length).toBe(1);
    });

    it("should add new installment options", () => {
      const installmentsData = [
        { installments: 1 },
        { installments: 2 },
        { installments: 3 },
        { installments: 6 },
      ];

      updateMercadoPagoInstallmentsSelect(installmentsData, 1);

      const select = document.getElementById(
        "form-checkout__installments"
      ) as HTMLSelectElement;
      
      expect(select.options.length).toBe(4);
      expect(select.options[0].value).toBe("1");
      expect(select.options[1].value).toBe("2");
      expect(select.options[2].value).toBe("3");
      expect(select.options[3].value).toBe("6");
    });

    it("should select current value", () => {
      const installmentsData = [
        { installments: 1 },
        { installments: 3 },
        { installments: 6 },
      ];

      updateMercadoPagoInstallmentsSelect(installmentsData, 3);

      const select = document.getElementById(
        "form-checkout__installments"
      ) as HTMLSelectElement;
      expect(select.value).toBe("3");
    });

    it("should handle empty installments array", () => {
      updateMercadoPagoInstallmentsSelect([], 1);

      const select = document.getElementById(
        "form-checkout__installments"
      ) as HTMLSelectElement;
      expect(select.options.length).toBe(0);
    });

    it("should handle missing select element", () => {
      document.body.innerHTML = ""; // Remove select

      // Should not throw
      expect(() => {
        updateMercadoPagoInstallmentsSelect([{ installments: 1 }], 1);
      }).not.toThrow();
    });

    it("should set correct text for options", () => {
      const installmentsData = [
        { installments: 1 },
        { installments: 12 },
      ];

      updateMercadoPagoInstallmentsSelect(installmentsData, 1);

      const select = document.getElementById(
        "form-checkout__installments"
      ) as HTMLSelectElement;
      
      expect(select.options[0].text).toBe("1x");
      expect(select.options[1].text).toBe("12x");
    });
  });
});
