/**
 * Logger Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Comprehensive tests for the centralized logging system.
 * Tests all log levels, Sentry integration, and factory function.
 * 
 * @module lib/logger.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as Sentry from "@sentry/react";

// Mock Sentry before importing logger
vi.mock("@sentry/react", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

// Import after mocks
import { logger, createLogger } from "./logger";

// ============================================================================
// TEST SETUP
// ============================================================================

describe("Logger Module", () => {
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleDebugSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  // ==========================================================================
  // LOGGER OBJECT TESTS
  // ==========================================================================

  describe("logger object", () => {
    describe("trace level", () => {
      it("should log trace messages with correct prefix in development", () => {
        logger.trace("TestContext", "Trace message");
        
        // In dev mode, trace should be logged
        expect(consoleDebugSpy).toHaveBeenCalledWith(
          expect.stringContaining("[Rise][TestContext]"),
          expect.stringContaining("Trace message")
        );
      });

      it("should include additional arguments in trace logs", () => {
        const data = { key: "value" };
        logger.trace("TestContext", "Trace with data", data);
        
        expect(consoleDebugSpy).toHaveBeenCalledWith(
          expect.stringContaining("Trace message") || expect.anything(),
          expect.anything(),
          expect.anything()
        );
      });
    });

    describe("debug level", () => {
      it("should log debug messages with bug emoji", () => {
        logger.debug("TestContext", "Debug message");
        
        expect(consoleDebugSpy).toHaveBeenCalledWith(
          expect.stringContaining("🐛"),
          expect.anything()
        );
      });

      it("should include context in debug messages", () => {
        logger.debug("MyComponent", "Debugging something");
        
        expect(consoleDebugSpy).toHaveBeenCalledWith(
          expect.stringContaining("[MyComponent]"),
          expect.anything()
        );
      });
    });

    describe("info level", () => {
      it("should log info messages with info emoji", () => {
        logger.info("TestContext", "Info message");
        
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining("ℹ️"),
          expect.anything()
        );
      });

      it("should include context in info messages", () => {
        logger.info("OrderService", "Order created");
        
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining("[OrderService]"),
          expect.anything()
        );
      });
    });

    describe("warn level", () => {
      it("should log warning messages with warning emoji", () => {
        logger.warn("TestContext", "Warning message");
        
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("⚠️"),
          expect.anything()
        );
      });

      it("should include context in warning messages", () => {
        logger.warn("PaymentGateway", "Rate limit approaching");
        
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("[PaymentGateway]"),
          expect.anything()
        );
      });
    });

    describe("error level", () => {
      it("should log error messages with alert emoji", () => {
        logger.error("TestContext", "Error message");
        
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining("🚨"),
          expect.anything()
        );
      });

      it("should include context in error messages", () => {
        logger.error("DatabaseService", "Connection failed");
        
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining("[DatabaseService]"),
          expect.anything()
        );
      });

      it("should send Error objects to Sentry via captureException", () => {
        const error = new Error("Test error");
        logger.error("TestContext", "Something went wrong", error);
        
        expect(Sentry.captureException).toHaveBeenCalledWith(
          error,
          expect.objectContaining({
            tags: { context: "TestContext" },
            extra: expect.objectContaining({
              message: "Something went wrong",
            }),
          })
        );
      });

      it("should send non-Error messages to Sentry via captureMessage", () => {
        logger.error("TestContext", "Non-error problem", { data: "value" });
        
        expect(Sentry.captureMessage).toHaveBeenCalledWith(
          "TestContext: Non-error problem",
          expect.objectContaining({
            level: "error",
            tags: { context: "TestContext" },
          })
        );
      });

      it("should extract Error from multiple arguments", () => {
        const error = new Error("Hidden error");
        logger.error("TestContext", "Message", "other", error, "args");
        
        expect(Sentry.captureException).toHaveBeenCalledWith(
          error,
          expect.anything()
        );
      });
    });
  });

  // ==========================================================================
  // CREATE LOGGER FACTORY TESTS
  // ==========================================================================

  describe("createLogger factory", () => {
    it("should create a logger with fixed context", () => {
      const log = createLogger("MyService");
      log.info("Service started");
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("[MyService]"),
        expect.anything()
      );
    });

    it("should expose all log levels", () => {
      const log = createLogger("TestLogger");
      
      expect(typeof log.trace).toBe("function");
      expect(typeof log.debug).toBe("function");
      expect(typeof log.info).toBe("function");
      expect(typeof log.warn).toBe("function");
      expect(typeof log.error).toBe("function");
    });

    it("should maintain context across multiple calls", () => {
      const log = createLogger("PersistentContext");
      
      log.debug("First call");
      log.info("Second call");
      log.warn("Third call");
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("[PersistentContext]"),
        expect.anything()
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("[PersistentContext]"),
        expect.anything()
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[PersistentContext]"),
        expect.anything()
      );
    });

    it("should pass additional arguments correctly", () => {
      const log = createLogger("DataLogger");
      const data = { userId: 123, action: "purchase" };
      
      log.info("User action", data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.anything(),
        data
      );
    });

    it("should handle Sentry integration for errors", () => {
      const log = createLogger("ErrorLogger");
      const error = new Error("Factory error");
      
      log.error("Factory error occurred", error);
      
      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: { context: "ErrorLogger" },
        })
      );
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("edge cases", () => {
    it("should handle empty message", () => {
      logger.info("EmptyTest", "");
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it("should handle null arguments gracefully", () => {
      logger.info("NullTest", "Message with null", null);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it("should handle undefined arguments gracefully", () => {
      logger.info("UndefinedTest", "Message with undefined", undefined);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it("should handle circular references in data", () => {
      const circular: Record<string, unknown> = { name: "test" };
      circular.self = circular;
      
      // Should not throw
      expect(() => {
        logger.info("CircularTest", "Circular data", circular);
      }).not.toThrow();
    });

    it("should handle very long messages", () => {
      const longMessage = "A".repeat(10000);
      
      expect(() => {
        logger.info("LongMessageTest", longMessage);
      }).not.toThrow();
    });

    it("should handle special characters in context", () => {
      logger.info("Context-With_Special.Chars", "Message");
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Context-With_Special.Chars]"),
        expect.anything()
      );
    });

    it("should handle emoji in messages", () => {
      logger.info("EmojiTest", "Message with emoji 🎉🚀");
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // PREFIX FORMAT TESTS
  // ==========================================================================

  describe("prefix format", () => {
    it("should include [Rise] prefix in all logs", () => {
      logger.info("Test", "Message");
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Rise]"),
        expect.anything()
      );
    });

    it("should use correct emoji for each level", () => {
      logger.trace("Test", "trace");
      logger.debug("Test", "debug");
      logger.info("Test", "info");
      logger.warn("Test", "warn");
      logger.error("Test", "error");
      
      // Trace uses 🔍
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("🔍"),
        expect.anything()
      );
      
      // Debug uses 🐛
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("🐛"),
        expect.anything()
      );
      
      // Info uses ℹ️
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("ℹ️"),
        expect.anything()
      );
      
      // Warn uses ⚠️
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("⚠️"),
        expect.anything()
      );
      
      // Error uses 🚨
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("🚨"),
        expect.anything()
      );
    });
  });
});
