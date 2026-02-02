/**
 * Mercado Pago Sync Helpers Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for MercadoPago SDK synchronization helpers.
 * 
 * @module lib/payment-gateways/helpers/__tests__/mercadopago-sync.test
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  syncMercadoPagoHiddenFields,
  updateMercadoPagoInstallmentsSelect,
  type MercadoPagoSyncData,
} from "../mercadopago-sync";

describe("syncMercadoPagoHiddenFields", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should sync cardholder name to hidden field", () => {
    const input = document.createElement("input");
    input.id = "form-checkout__cardholderName";
    document.body.appendChild(input);

    const data: MercadoPagoSyncData = {
      cardholderName: "João Silva",
      cardholderDocument: "123.456.789-00",
      installments: 1,
    };

    syncMercadoPagoHiddenFields(data);

    expect(input.value).toBe("João Silva");
  });

  it("should clean document mask before syncing", () => {
    const input = document.createElement("input");
    input.id = "form-checkout__identificationNumber";
    document.body.appendChild(input);

    const data: MercadoPagoSyncData = {
      cardholderName: "João Silva",
      cardholderDocument: "123.456.789-00",
      installments: 1,
    };

    syncMercadoPagoHiddenFields(data);

    expect(input.value).toBe("12345678900");
  });

  it("should set document type as CPF for documents with 11 digits or less", () => {
    const select = document.createElement("select");
    select.id = "form-checkout__identificationType";
    
    const cpfOption = document.createElement("option");
    cpfOption.value = "CPF";
    select.appendChild(cpfOption);
    
    const cnpjOption = document.createElement("option");
    cnpjOption.value = "CNPJ";
    select.appendChild(cnpjOption);
    
    document.body.appendChild(select);

    const data: MercadoPagoSyncData = {
      cardholderName: "João Silva",
      cardholderDocument: "123.456.789-00",
      installments: 1,
    };

    syncMercadoPagoHiddenFields(data);

    expect(select.value).toBe("CPF");
  });

  it("should set document type as CNPJ for documents with more than 11 digits", () => {
    const select = document.createElement("select");
    select.id = "form-checkout__identificationType";
    
    const cpfOption = document.createElement("option");
    cpfOption.value = "CPF";
    select.appendChild(cpfOption);
    
    const cnpjOption = document.createElement("option");
    cnpjOption.value = "CNPJ";
    select.appendChild(cnpjOption);
    
    document.body.appendChild(select);

    const data: MercadoPagoSyncData = {
      cardholderName: "Empresa LTDA",
      cardholderDocument: "12.345.678/0001-90",
      installments: 1,
    };

    syncMercadoPagoHiddenFields(data);

    expect(select.value).toBe("CNPJ");
  });

  it("should sync installments to hidden select", () => {
    const select = document.createElement("select");
    select.id = "form-checkout__installments";
    
    // Add options to select
    for (let i = 1; i <= 12; i++) {
      const option = document.createElement("option");
      option.value = i.toString();
      select.appendChild(option);
    }
    
    document.body.appendChild(select);

    const data: MercadoPagoSyncData = {
      cardholderName: "João Silva",
      cardholderDocument: "123.456.789-00",
      installments: 3,
    };

    syncMercadoPagoHiddenFields(data);

    expect(select.value).toBe("3");
  });

  it("should dispatch input events for fields", () => {
    const input = document.createElement("input");
    input.id = "form-checkout__cardholderName";
    document.body.appendChild(input);

    const dispatchSpy = vi.spyOn(input, "dispatchEvent");

    const data: MercadoPagoSyncData = {
      cardholderName: "João Silva",
      cardholderDocument: "123.456.789-00",
      installments: 1,
    };

    syncMercadoPagoHiddenFields(data);

    expect(dispatchSpy).toHaveBeenCalled();
  });

  it("should handle missing hidden fields gracefully", () => {
    const data: MercadoPagoSyncData = {
      cardholderName: "João Silva",
      cardholderDocument: "123.456.789-00",
      installments: 1,
    };

    expect(() => syncMercadoPagoHiddenFields(data)).not.toThrow();
  });
});

describe("updateMercadoPagoInstallmentsSelect", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should create options for each installment", () => {
    const select = document.createElement("select");
    select.id = "form-checkout__installments";
    document.body.appendChild(select);

    const installmentsData = [
      { installments: 1 },
      { installments: 2 },
      { installments: 3 },
    ];

    updateMercadoPagoInstallmentsSelect(installmentsData, 1);

    expect(select.options.length).toBe(3);
    expect(select.options[0].value).toBe("1");
    expect(select.options[1].value).toBe("2");
    expect(select.options[2].value).toBe("3");
  });

  it("should set selected installment value", () => {
    const select = document.createElement("select");
    select.id = "form-checkout__installments";
    document.body.appendChild(select);

    const installmentsData = [
      { installments: 1 },
      { installments: 2 },
      { installments: 3 },
    ];

    updateMercadoPagoInstallmentsSelect(installmentsData, 2);

    expect(select.value).toBe("2");
  });

  it("should clear existing options before adding new ones", () => {
    const select = document.createElement("select");
    select.id = "form-checkout__installments";
    
    const oldOption = document.createElement("option");
    oldOption.value = "99";
    select.appendChild(oldOption);
    
    document.body.appendChild(select);

    const installmentsData = [{ installments: 1 }];

    updateMercadoPagoInstallmentsSelect(installmentsData, 1);

    expect(select.options.length).toBe(1);
    expect(select.options[0].value).toBe("1");
  });

  it("should handle missing select element gracefully", () => {
    const installmentsData = [{ installments: 1 }];

    expect(() => updateMercadoPagoInstallmentsSelect(installmentsData, 1)).not.toThrow();
  });

  it("should format option text correctly", () => {
    const select = document.createElement("select");
    select.id = "form-checkout__installments";
    document.body.appendChild(select);

    const installmentsData = [{ installments: 6 }];

    updateMercadoPagoInstallmentsSelect(installmentsData, 6);

    expect(select.options[0].text).toBe("6x");
  });
});
