/**
 * Video Config Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Video item configuration covering:
 * - Config structure validation
 * - Default values
 * - Video type enum validation
 *
 * @module components/checkout/builder/items/Video/__tests__/VideoConfig.test
 */

import { describe, it, expect } from "vitest";
import { VideoConfig, type VideoContent } from "../index";
import { VideoView } from "../VideoView";
import { VideoEditor } from "../VideoEditor";

describe("VideoConfig", () => {
  describe("Configuration Structure", () => {
    it("has all required fields", () => {
      expect(VideoConfig).toHaveProperty("label");
      expect(VideoConfig).toHaveProperty("icon");
      expect(VideoConfig).toHaveProperty("view");
      expect(VideoConfig).toHaveProperty("editor");
      expect(VideoConfig).toHaveProperty("defaults");
    });

    it("has correct label", () => {
      expect(VideoConfig.label).toBe("Vídeo");
    });

    it("references VideoView component", () => {
      expect(VideoConfig.view).toBe(VideoView);
    });

    it("references VideoEditor component", () => {
      expect(VideoConfig.editor).toBe(VideoEditor);
    });
  });

  describe("Default Values", () => {
    it("has videoType default", () => {
      expect(VideoConfig.defaults.videoType).toBe("youtube");
    });

    it("has empty videoUrl default", () => {
      expect(VideoConfig.defaults.videoUrl).toBe("");
    });

    it("videoType is valid enum value", () => {
      const validTypes: Array<VideoContent["videoType"]> = ["youtube", "vimeo", "custom"];
      expect(validTypes).toContain(VideoConfig.defaults.videoType);
    });
  });

  describe("Type Validation", () => {
    it("defaults match VideoContent type structure", () => {
      const defaults: VideoContent = VideoConfig.defaults;
      expect(defaults).toBeDefined();
    });
  });
});
