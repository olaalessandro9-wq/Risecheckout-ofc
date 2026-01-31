/**
 * @file types.test.ts
 * @description Tests for Asaas types validation
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import type {
  AsaasEnvironment,
  AsaasCredentials,
  AsaasConfig,
  AsaasCustomerData,
  AsaasPaymentRequest,
  AsaasPaymentResponse,
  AsaasValidationResult,
  AsaasIntegrationConfig,
} from "../types";

describe("Asaas Types", () => {
  describe("AsaasEnvironment", () => {
    it("should allow sandbox value", () => {
      const env: AsaasEnvironment = "sandbox";
      expect(env).toBe("sandbox");
    });

    it("should allow production value", () => {
      const env: AsaasEnvironment = "production";
      expect(env).toBe("production");
    });
  });

  describe("AsaasCredentials", () => {
    it("should have required properties", () => {
      const credentials: AsaasCredentials = {
        api_key: "$aact_xxx",
        environment: "production",
      };

      expect(credentials.api_key).toBe("$aact_xxx");
      expect(credentials.environment).toBe("production");
    });
  });

  describe("AsaasConfig", () => {
    it("should have required properties", () => {
      const config: AsaasConfig = {
        apiKey: "$aact_xxx",
        environment: "production",
        isConfigured: true,
      };

      expect(config.apiKey).toBe("$aact_xxx");
      expect(config.environment).toBe("production");
      expect(config.isConfigured).toBe(true);
    });

    it("should allow optional properties", () => {
      const config: AsaasConfig = {
        apiKey: "$aact_xxx",
        environment: "production",
        isConfigured: true,
        walletId: "wallet-123",
        accountName: "Test Account",
      };

      expect(config.walletId).toBe("wallet-123");
      expect(config.accountName).toBe("Test Account");
    });
  });

  describe("AsaasCustomerData", () => {
    it("should have required properties", () => {
      const customer: AsaasCustomerData = {
        name: "John Doe",
        email: "john@example.com",
        cpfCnpj: "12345678901",
      };

      expect(customer.name).toBe("John Doe");
      expect(customer.email).toBe("john@example.com");
      expect(customer.cpfCnpj).toBe("12345678901");
    });

    it("should allow optional phone", () => {
      const customer: AsaasCustomerData = {
        name: "John Doe",
        email: "john@example.com",
        cpfCnpj: "12345678901",
        phone: "11999999999",
      };

      expect(customer.phone).toBe("11999999999");
    });
  });

  describe("AsaasPaymentRequest", () => {
    it("should have required properties for PIX", () => {
      const request: AsaasPaymentRequest = {
        vendorId: "vendor-123",
        amountCents: 10000,
        description: "Test Payment",
        customer: {
          name: "John Doe",
          email: "john@example.com",
          cpfCnpj: "12345678901",
        },
        paymentMethod: "pix",
      };

      expect(request.vendorId).toBe("vendor-123");
      expect(request.amountCents).toBe(10000);
      expect(request.paymentMethod).toBe("pix");
    });

    it("should have required properties for credit card", () => {
      const request: AsaasPaymentRequest = {
        vendorId: "vendor-123",
        amountCents: 10000,
        description: "Test Payment",
        customer: {
          name: "John Doe",
          email: "john@example.com",
          cpfCnpj: "12345678901",
        },
        paymentMethod: "credit_card",
        cardToken: "card-token-123",
        installments: 3,
      };

      expect(request.paymentMethod).toBe("credit_card");
      expect(request.cardToken).toBe("card-token-123");
      expect(request.installments).toBe(3);
    });
  });

  describe("AsaasPaymentResponse", () => {
    it("should have success status for PIX", () => {
      const response: AsaasPaymentResponse = {
        success: true,
        transactionId: "txn-123",
        status: "pending",
        qrCode: "data:image/png;base64,xxx",
        qrCodeText: "00020126...",
        pixId: "pix-123",
      };

      expect(response.success).toBe(true);
      expect(response.qrCode).toBeDefined();
      expect(response.qrCodeText).toBeDefined();
    });

    it("should have error message on failure", () => {
      const response: AsaasPaymentResponse = {
        success: false,
        errorMessage: "Payment failed",
      };

      expect(response.success).toBe(false);
      expect(response.errorMessage).toBe("Payment failed");
    });

    it("should have valid status values", () => {
      const statuses: AsaasPaymentResponse["status"][] = [
        "pending",
        "approved",
        "refused",
        "processing",
      ];

      statuses.forEach((status) => {
        const response: AsaasPaymentResponse = {
          success: true,
          status,
        };
        expect(response.status).toBe(status);
      });
    });
  });

  describe("AsaasValidationResult", () => {
    it("should have valid property", () => {
      const result: AsaasValidationResult = {
        valid: true,
        accountName: "Test Company",
        walletId: "wallet-123",
      };

      expect(result.valid).toBe(true);
      expect(result.accountName).toBe("Test Company");
    });

    it("should have message on invalid", () => {
      const result: AsaasValidationResult = {
        valid: false,
        message: "Invalid API key",
      };

      expect(result.valid).toBe(false);
      expect(result.message).toBe("Invalid API key");
    });
  });

  describe("AsaasIntegrationConfig", () => {
    it("should have required properties", () => {
      const config: AsaasIntegrationConfig = {
        api_key: "$aact_xxx",
        environment: "production",
      };

      expect(config.api_key).toBe("$aact_xxx");
      expect(config.environment).toBe("production");
    });

    it("should allow all optional properties", () => {
      const config: AsaasIntegrationConfig = {
        api_key: "$aact_xxx",
        environment: "production",
        wallet_id: "wallet-123",
        validated_at: "2026-01-31T00:00:00Z",
        account_name: "Test Company",
      };

      expect(config.wallet_id).toBe("wallet-123");
      expect(config.validated_at).toBe("2026-01-31T00:00:00Z");
      expect(config.account_name).toBe("Test Company");
    });
  });
});
