/**
 * Testimonial Config Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Testimonial item configuration covering:
 * - Config structure validation
 * - Default values
 * - Optional fields handling
 *
 * @module components/checkout/builder/items/Testimonial/__tests__/TestimonialConfig.test
 */

import { describe, it, expect } from "vitest";
import { TestimonialConfig, type TestimonialContent } from "../index";
import { TestimonialView } from "../TestimonialView";
import { TestimonialEditor } from "../TestimonialEditor";

describe("TestimonialConfig", () => {
  describe("Configuration Structure", () => {
    it("has all required fields", () => {
      expect(TestimonialConfig).toHaveProperty("label");
      expect(TestimonialConfig).toHaveProperty("icon");
      expect(TestimonialConfig).toHaveProperty("view");
      expect(TestimonialConfig).toHaveProperty("editor");
      expect(TestimonialConfig).toHaveProperty("defaults");
    });

    it("has correct label", () => {
      expect(TestimonialConfig.label).toBe("Depoimento");
    });

    it("references TestimonialView component", () => {
      expect(TestimonialConfig.view).toBe(TestimonialView);
    });

    it("references TestimonialEditor component", () => {
      expect(TestimonialConfig.editor).toBe(TestimonialEditor);
    });
  });

  describe("Default Values", () => {
    it("has all required default fields", () => {
      expect(TestimonialConfig.defaults).toHaveProperty("testimonialText");
      expect(TestimonialConfig.defaults).toHaveProperty("authorName");
      expect(TestimonialConfig.defaults).toHaveProperty("authorImage");
    });

    it("has correct default testimonialText", () => {
      expect(TestimonialConfig.defaults.testimonialText).toBe("Depoimento do cliente aqui");
    });

    it("has correct default authorName", () => {
      expect(TestimonialConfig.defaults.authorName).toBe("Nome do Cliente");
    });

    it("has empty authorImage by default", () => {
      expect(TestimonialConfig.defaults.authorImage).toBe("");
    });
  });

  describe("Type Validation", () => {
    it("defaults match TestimonialContent type structure", () => {
      const defaults: TestimonialContent = TestimonialConfig.defaults;
      expect(defaults).toBeDefined();
    });
  });
});
