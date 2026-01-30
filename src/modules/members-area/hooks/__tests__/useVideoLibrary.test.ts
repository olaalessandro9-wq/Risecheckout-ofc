/**
 * useVideoLibrary Hook Tests
 * 
 * RISE V3 Compliant - 10.0/10
 * Tests video library fetching and YouTube thumbnail generation
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVideoLibrary } from "../useVideoLibrary";
import { api } from "@/lib/api";

// Mock dependencies
vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe("useVideoLibrary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should start with empty videos and not loading", () => {
      const { result } = renderHook(() => useVideoLibrary());

      expect(result.current.videos).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("fetchVideos", () => {
    it("should fetch videos and generate thumbnails", async () => {
      const mockVideos = [
        {
          id: "video-1",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          title: "Video 1",
          moduleTitle: "Module 1",
        },
        {
          id: "video-2",
          url: "https://youtu.be/abc123def45",
          title: "Video 2",
          moduleTitle: "Module 2",
        },
      ];

      (api.call as Mock).mockResolvedValueOnce({
        data: { videos: mockVideos },
        error: null,
      });

      const { result } = renderHook(() => useVideoLibrary());

      await act(async () => {
        await result.current.fetchVideos("product-1");
      });

      expect(result.current.videos).toHaveLength(2);
      expect(result.current.videos[0].thumbnail).toBe(
        "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg"
      );
      expect(result.current.videos[1].thumbnail).toBe(
        "https://img.youtube.com/vi/abc123def45/mqdefault.jpg"
      );
    });

    it("should handle embed URLs", async () => {
      const mockVideos = [
        {
          id: "video-1",
          url: "https://www.youtube.com/embed/xyz789abc12",
          title: "Embedded Video",
          moduleTitle: "Module 1",
        },
      ];

      (api.call as Mock).mockResolvedValueOnce({
        data: { videos: mockVideos },
        error: null,
      });

      const { result } = renderHook(() => useVideoLibrary());

      await act(async () => {
        await result.current.fetchVideos("product-1");
      });

      expect(result.current.videos[0].thumbnail).toBe(
        "https://img.youtube.com/vi/xyz789abc12/mqdefault.jpg"
      );
    });

    it("should handle direct video IDs", async () => {
      const mockVideos = [
        {
          id: "video-1",
          url: "dQw4w9WgXcQ",
          title: "Direct ID Video",
          moduleTitle: "Module 1",
        },
      ];

      (api.call as Mock).mockResolvedValueOnce({
        data: { videos: mockVideos },
        error: null,
      });

      const { result } = renderHook(() => useVideoLibrary());

      await act(async () => {
        await result.current.fetchVideos("product-1");
      });

      expect(result.current.videos[0].thumbnail).toBe(
        "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg"
      );
    });

    it("should set null thumbnail for non-YouTube URLs", async () => {
      const mockVideos = [
        {
          id: "video-1",
          url: "https://vimeo.com/123456",
          title: "Vimeo Video",
          moduleTitle: "Module 1",
        },
      ];

      (api.call as Mock).mockResolvedValueOnce({
        data: { videos: mockVideos },
        error: null,
      });

      const { result } = renderHook(() => useVideoLibrary());

      await act(async () => {
        await result.current.fetchVideos("product-1");
      });

      expect(result.current.videos[0].thumbnail).toBeNull();
    });

    it("should not fetch when productId is empty", async () => {
      const { result } = renderHook(() => useVideoLibrary());

      await act(async () => {
        await result.current.fetchVideos("");
      });

      expect(api.call).not.toHaveBeenCalled();
    });

    it("should pass excludeContentId when provided", async () => {
      (api.call as Mock).mockResolvedValueOnce({
        data: { videos: [] },
        error: null,
      });

      const { result } = renderHook(() => useVideoLibrary());

      await act(async () => {
        await result.current.fetchVideos("product-1", "content-to-exclude");
      });

      expect(api.call).toHaveBeenCalledWith("content-library", {
        action: "get-video-library",
        productId: "product-1",
        excludeContentId: "content-to-exclude",
      });
    });

    it("should handle API error gracefully", async () => {
      (api.call as Mock).mockResolvedValueOnce({
        data: null,
        error: { message: "Network error" },
      });

      const { result } = renderHook(() => useVideoLibrary());

      await act(async () => {
        await result.current.fetchVideos("product-1");
      });

      expect(result.current.videos).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle empty response", async () => {
      (api.call as Mock).mockResolvedValueOnce({
        data: { videos: undefined },
        error: null,
      });

      const { result } = renderHook(() => useVideoLibrary());

      await act(async () => {
        await result.current.fetchVideos("product-1");
      });

      expect(result.current.videos).toEqual([]);
    });
  });

  describe("loading state", () => {
    it("should set loading during fetch", async () => {
      let resolvePromise: ((value: unknown) => void) | undefined;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (api.call as Mock).mockReturnValueOnce(promise);

      const { result } = renderHook(() => useVideoLibrary());

      act(() => {
        result.current.fetchVideos("product-1");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise?.({ data: { videos: [] }, error: null });
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
