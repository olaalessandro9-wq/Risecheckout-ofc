/**
 * Timer Config Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Timer item configuration covering:
 * - Config structure validation
 * - Default values
 * - Time values validation
 * - Color validation
 *
 * @module components/checkout/builder/items/Timer/__tests__/TimerConfig.test
 */

import { describe, it, expect } from "vitest";
import { TimerConfig, type TimerContent } from "../index";
import { TimerView } from "../TimerView";
import { TimerEditor } from "../TimerEditor";

describe("TimerConfig", () => {
  describe("Configuration Structure", () => {
    it("has all required fields", () => {
      expect(TimerConfig).toHaveProperty("label");
      expect(TimerConfig).toHaveProperty("icon");
      expect(TimerConfig).toHaveProperty("view");
      expect(TimerConfig).toHaveProperty("editor");
      expect(TimerConfig).toHaveProperty("defaults");
    });

    it("has correct label", () => {
      expect(TimerConfig.label).toBe("Timer");
    });

    it("references TimerView component", () => {
      expect(TimerConfig.view).toBe(TimerView);
    });

    it("references TimerEditor component", () => {
      expect(TimerConfig.editor).toBe(TimerEditor);
    });
  });

  describe("Default Values", () => {
    it("has all required default fields", () => {
      expect(TimerConfig.defaults).toHaveProperty("minutes");
      expect(TimerConfig.defaults).toHaveProperty("seconds");
      expect(TimerConfig.defaults).toHaveProperty("timerColor");
      expect(TimerConfig.defaults).toHaveProperty("textColor");
      expect(TimerConfig.defaults).toHaveProperty("activeText");
      expect(TimerConfig.defaults).toHaveProperty("finishedText");
      expect(TimerConfig.defaults).toHaveProperty("fixedTop");
    });

    it("has correct default minutes", () => {
      expect(TimerConfig.defaults.minutes).toBe(15);
      expect(typeof TimerConfig.defaults.minutes).toBe("number");
    });

    it("has correct default seconds", () => {
      expect(TimerConfig.defaults.seconds).toBe(0);
      expect(typeof TimerConfig.defaults.seconds).toBe("number");
    });

    it("has correct default timerColor", () => {
      expect(TimerConfig.defaults.timerColor).toBe("#10B981");
      expect(TimerConfig.defaults.timerColor).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("has correct default textColor", () => {
      expect(TimerConfig.defaults.textColor).toBe("#FFFFFF");
      expect(TimerConfig.defaults.textColor).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("has correct default activeText", () => {
      expect(TimerConfig.defaults.activeText).toBe("Oferta por tempo limitado");
    });

    it("has correct default finishedText", () => {
      expect(TimerConfig.defaults.finishedText).toBe("Oferta finalizada");
    });

    it("has correct default fixedTop", () => {
      expect(TimerConfig.defaults.fixedTop).toBe(false);
      expect(typeof TimerConfig.defaults.fixedTop).toBe("boolean");
    });
  });

  describe("Type Validation", () => {
    it("defaults match TimerContent type structure", () => {
      const defaults: TimerContent = TimerConfig.defaults;
      expect(defaults).toBeDefined();
    });

    it("minutes is non-negative", () => {
      expect(TimerConfig.defaults.minutes).toBeGreaterThanOrEqual(0);
    });

    it("seconds is non-negative", () => {
      expect(TimerConfig.defaults.seconds).toBeGreaterThanOrEqual(0);
    });

    it("seconds is less than 60", () => {
      expect(TimerConfig.defaults.seconds).toBeLessThan(60);
    });

    it("fixedTop is boolean", () => {
      expect(typeof TimerConfig.defaults.fixedTop).toBe("boolean");
    });
  });
});
