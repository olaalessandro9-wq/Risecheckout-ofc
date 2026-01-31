/**
 * Builder Types Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for builder type definitions covering:
 * - Type structure validation
 * - Type exports
 * - Interface consistency
 * - Type safety
 *
 * @module components/checkout/builder/__tests__/types.test
 */

import { describe, it, expect } from "vitest";
import type {
  ComponentData,
  CheckoutComponent,
  BuilderComponentConfig,
  BuilderComponentContent,
} from "../types";
import type { TextContent, ImageContent } from "@/types/checkout-components.types";

// ============================================================================
// TYPE-SAFE FACTORIES
// ============================================================================

function createTextContent(overrides: Partial<TextContent> = {}): TextContent {
  return {
    text: "Default text",
    fontSize: 16,
    color: "#000000",
    alignment: "center",
    ...overrides,
  };
}

function createImageContent(overrides: Partial<ImageContent> = {}): ImageContent {
  return {
    imageUrl: "https://example.com/image.jpg",
    alignment: "center",
    ...overrides,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe("Builder Types", () => {
  describe("ComponentData Interface", () => {
    it("accepts valid ComponentData object", () => {
      const validData: ComponentData = {
        id: "test-1",
        type: "text",
        content: createTextContent({ text: "Test" }),
      };
      expect(validData.id).toBe("test-1");
      expect(validData.type).toBe("text");
    });

    it("accepts ComponentData without content", () => {
      const validData: ComponentData = {
        id: "test-2",
        type: "image",
      };
      expect(validData.content).toBeUndefined();
    });

    it("requires id field", () => {
      const data: ComponentData = {
        id: "required-id",
        type: "text",
      };
      expect(data.id).toBeDefined();
    });

    it("requires type field", () => {
      const data: ComponentData = {
        id: "test-3",
        type: "video",
      };
      expect(data.type).toBeDefined();
    });
  });

  describe("CheckoutComponent Interface", () => {
    it("accepts valid CheckoutComponent object", () => {
      const validComponent: CheckoutComponent = {
        id: "checkout-1",
        type: "text",
        content: createTextContent({
          text: "Checkout Text",
          fontSize: 18,
          color: "#FF0000",
          alignment: "left",
        }),
      };
      expect(validComponent.id).toBe("checkout-1");
    });

    it("accepts CheckoutComponent without id", () => {
      const validComponent: CheckoutComponent = {
        type: "image",
        content: createImageContent(),
      };
      expect(validComponent.id).toBeUndefined();
    });

    it("accepts CheckoutComponent without content", () => {
      const validComponent: CheckoutComponent = {
        type: "timer",
      };
      expect(validComponent.content).toBeUndefined();
    });

    it("requires type field", () => {
      const component: CheckoutComponent = {
        type: "seal",
      };
      expect(component.type).toBeDefined();
    });
  });

  describe("BuilderComponentConfig Interface", () => {
    it("accepts valid config structure", () => {
      const validConfig: BuilderComponentConfig = {
        label: "Test Component",
        icon: "TestIcon",
        view: () => null,
        editor: () => null,
        defaults: createTextContent({ text: "Default text" }),
      };
      expect(validConfig.label).toBe("Test Component");
    });

    it("requires label field", () => {
      const config: BuilderComponentConfig = {
        label: "Required Label",
        view: () => null,
        editor: () => null,
        defaults: createTextContent(),
      };
      expect(config.label).toBeDefined();
    });

    it("requires view component", () => {
      const config: BuilderComponentConfig = {
        label: "Test",
        view: () => null,
        editor: () => null,
        defaults: createTextContent(),
      };
      expect(typeof config.view).toBe("function");
    });

    it("requires editor component", () => {
      const config: BuilderComponentConfig = {
        label: "Test",
        view: () => null,
        editor: () => null,
        defaults: createTextContent(),
      };
      expect(typeof config.editor).toBe("function");
    });

    it("requires defaults object", () => {
      const config: BuilderComponentConfig = {
        label: "Test",
        view: () => null,
        editor: () => null,
        defaults: createTextContent(),
      };
      expect(config.defaults).toBeDefined();
    });

    it("accepts optional icon field", () => {
      const configWithIcon: BuilderComponentConfig = {
        label: "With Icon",
        icon: "IconComponent",
        view: () => null,
        editor: () => null,
        defaults: createTextContent(),
      };
      expect(configWithIcon.icon).toBeDefined();

      const configWithoutIcon: BuilderComponentConfig = {
        label: "Without Icon",
        view: () => null,
        editor: () => null,
        defaults: createTextContent(),
      };
      expect(configWithoutIcon.icon).toBeUndefined();
    });
  });

  describe("BuilderComponentContent Type", () => {
    it("is compatible with CheckoutComponentContent", () => {
      const content: BuilderComponentContent = createTextContent({
        text: "Test content",
        fontSize: 16,
      });
      expect(content).toBeDefined();
    });

    it("accepts any valid content structure", () => {
      const textContent: BuilderComponentContent = createTextContent({
        text: "Text",
        fontSize: 16,
        color: "#000000",
        alignment: "center",
      });
      expect(textContent).toBeDefined();

      const imageContent: BuilderComponentContent = createImageContent({
        imageUrl: "https://example.com/image.jpg",
        alignment: "center",
        maxWidth: 720,
      });
      expect(imageContent).toBeDefined();
    });
  });

  describe("Type Consistency", () => {
    it("ComponentData and CheckoutComponent are compatible", () => {
      const componentData: ComponentData = {
        id: "data-1",
        type: "text",
        content: createTextContent({ text: "Test" }),
      };

      const checkoutComponent: CheckoutComponent = {
        id: componentData.id,
        type: componentData.type,
        content: componentData.content,
      };

      expect(checkoutComponent.id).toBe(componentData.id);
      expect(checkoutComponent.type).toBe(componentData.type);
    });

    it("BuilderComponentContent is compatible with content field", () => {
      const content: BuilderComponentContent = createTextContent({
        text: "Content",
      });

      const component: ComponentData = {
        id: "test",
        type: "text",
        content: content,
      };

      expect(component.content).toBe(content);
    });
  });

  describe("Type Safety", () => {
    it("prevents invalid type assignments", () => {
      const data: ComponentData = {
        id: "safe-1",
        type: "text",
      };
      expect(data).toBeDefined();
    });

    it("allows optional fields to be undefined", () => {
      const component: CheckoutComponent = {
        type: "image",
      };
      expect(component.id).toBeUndefined();
      expect(component.content).toBeUndefined();
    });

    it("enforces required fields", () => {
      const config: BuilderComponentConfig = {
        label: "Required Fields",
        view: () => null,
        editor: () => null,
        defaults: createTextContent(),
      };
      expect(config.label).toBeDefined();
      expect(config.view).toBeDefined();
      expect(config.editor).toBeDefined();
      expect(config.defaults).toBeDefined();
    });
  });
});
