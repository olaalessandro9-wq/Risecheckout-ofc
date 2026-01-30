/**
 * Component Registry Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for ComponentRegistry covering:
 * - Registry structure
 * - All components registered
 * - Component config validation
 * - getComponentConfig function
 *
 * @module components/checkout/builder/__tests__/registry.test
 */

import { describe, it, expect } from "vitest";
import { ComponentRegistry, getComponentConfig } from "../registry";
import { TextConfig } from "../items/Text";
import { ImageConfig } from "../items/Image";
import { VideoConfig } from "../items/Video";
import { TimerConfig } from "../items/Timer";
import { TestimonialConfig } from "../items/Testimonial";
import { OrderBumpConfig } from "../items/OrderBump";
import { AdvantageConfig } from "../items/Advantage";
import { SealConfig } from "../items/Seal";

describe("ComponentRegistry", () => {
  describe("Registry Structure", () => {
    it("is defined and is an object", () => {
      expect(ComponentRegistry).toBeDefined();
      expect(typeof ComponentRegistry).toBe("object");
    });

    it("has all 8 component types registered", () => {
      const registeredTypes = Object.keys(ComponentRegistry);
      expect(registeredTypes).toHaveLength(8);
    });

    it("has text component registered", () => {
      expect(ComponentRegistry).toHaveProperty("text");
    });

    it("has image component registered", () => {
      expect(ComponentRegistry).toHaveProperty("image");
    });

    it("has timer component registered", () => {
      expect(ComponentRegistry).toHaveProperty("timer");
    });

    it("has video component registered", () => {
      expect(ComponentRegistry).toHaveProperty("video");
    });

    it("has testimonial component registered", () => {
      expect(ComponentRegistry).toHaveProperty("testimonial");
    });

    it("has orderbump component registered", () => {
      expect(ComponentRegistry).toHaveProperty("orderbump");
    });

    it("has advantage component registered", () => {
      expect(ComponentRegistry).toHaveProperty("advantage");
    });

    it("has seal component registered", () => {
      expect(ComponentRegistry).toHaveProperty("seal");
    });
  });

  describe("Component Config References", () => {
    it("text config references TextConfig", () => {
      expect(ComponentRegistry.text).toBe(TextConfig);
    });

    it("image config references ImageConfig", () => {
      expect(ComponentRegistry.image).toBe(ImageConfig);
    });

    it("timer config references TimerConfig", () => {
      expect(ComponentRegistry.timer).toBe(TimerConfig);
    });

    it("video config references VideoConfig", () => {
      expect(ComponentRegistry.video).toBe(VideoConfig);
    });

    it("testimonial config references TestimonialConfig", () => {
      expect(ComponentRegistry.testimonial).toBe(TestimonialConfig);
    });

    it("orderbump config references OrderBumpConfig", () => {
      expect(ComponentRegistry.orderbump).toBe(OrderBumpConfig);
    });

    it("advantage config references AdvantageConfig", () => {
      expect(ComponentRegistry.advantage).toBe(AdvantageConfig);
    });

    it("seal config references SealConfig", () => {
      expect(ComponentRegistry.seal).toBe(SealConfig);
    });
  });

  describe("Component Config Validation", () => {
    const componentTypes = [
      "text",
      "image",
      "timer",
      "video",
      "testimonial",
      "orderbump",
      "advantage",
      "seal",
    ];

    componentTypes.forEach((type) => {
      describe(`${type} config`, () => {
        it("has label property", () => {
          expect(ComponentRegistry[type]).toHaveProperty("label");
          expect(typeof ComponentRegistry[type].label).toBe("string");
        });

        it("has icon property", () => {
          expect(ComponentRegistry[type]).toHaveProperty("icon");
        });

        it("has view component", () => {
          expect(ComponentRegistry[type]).toHaveProperty("view");
          expect(typeof ComponentRegistry[type].view).toBe("function");
        });

        it("has editor component", () => {
          expect(ComponentRegistry[type]).toHaveProperty("editor");
          expect(typeof ComponentRegistry[type].editor).toBe("function");
        });

        it("has defaults object", () => {
          expect(ComponentRegistry[type]).toHaveProperty("defaults");
          expect(typeof ComponentRegistry[type].defaults).toBe("object");
        });
      });
    });
  });

  describe("getComponentConfig", () => {
    it("returns config for valid component type", () => {
      const config = getComponentConfig("text");
      expect(config).toBe(TextConfig);
    });

    it("returns config for all registered types", () => {
      expect(getComponentConfig("text")).toBe(TextConfig);
      expect(getComponentConfig("image")).toBe(ImageConfig);
      expect(getComponentConfig("timer")).toBe(TimerConfig);
      expect(getComponentConfig("video")).toBe(VideoConfig);
      expect(getComponentConfig("testimonial")).toBe(TestimonialConfig);
      expect(getComponentConfig("orderbump")).toBe(OrderBumpConfig);
      expect(getComponentConfig("advantage")).toBe(AdvantageConfig);
      expect(getComponentConfig("seal")).toBe(SealConfig);
    });

    it("returns null for invalid component type", () => {
      const config = getComponentConfig("invalid");
      expect(config).toBeNull();
    });

    it("returns null for empty string", () => {
      const config = getComponentConfig("");
      expect(config).toBeNull();
    });

    it("returns null for undefined type", () => {
      const config = getComponentConfig("undefined");
      expect(config).toBeNull();
    });

    it("is case-sensitive", () => {
      const config = getComponentConfig("TEXT");
      expect(config).toBeNull();
    });
  });

  describe("Registry Consistency", () => {
    it("all configs have unique labels", () => {
      const labels = Object.values(ComponentRegistry).map((config) => config.label);
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(labels.length);
    });

    it("all configs have non-empty labels", () => {
      Object.values(ComponentRegistry).forEach((config) => {
        expect(config.label).toBeTruthy();
        expect(config.label.length).toBeGreaterThan(0);
      });
    });

    it("all configs have defaults defined", () => {
      Object.values(ComponentRegistry).forEach((config) => {
        expect(config.defaults).toBeDefined();
        expect(config.defaults).not.toBeNull();
      });
    });
  });
});
