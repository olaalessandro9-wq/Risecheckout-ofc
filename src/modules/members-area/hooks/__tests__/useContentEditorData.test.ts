/**
 * useContentEditorData Hook Tests
 * 
 * RISE V3 Compliant - 10.0/10
 * Tests content editor data fetching
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useContentEditorData } from "../useContentEditorData";
import { api } from "@/lib/api";
import type { ContentAttachment } from "../../types";

// Mock dependencies
vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe("useContentEditorData", () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("new content mode", () => {
    it("should not be loading for new content", async () => {
      (api.call as Mock).mockResolvedValueOnce({
        data: { moduleContents: [] },
        error: null,
      });

      const { result } = renderHook(() =>
        useContentEditorData({
          isNew: true,
          contentId: null,
          moduleId: "module-1",
          onBack: mockOnBack,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should have default content state for new content", async () => {
      (api.call as Mock).mockResolvedValueOnce({
        data: { moduleContents: [] },
        error: null,
      });

      const { result } = renderHook(() =>
        useContentEditorData({
          isNew: true,
          contentId: null,
          moduleId: "module-1",
          onBack: mockOnBack,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.content).toEqual({
        title: "",
        video_url: null,
        body: null,
      });
    });

    it("should have default release state for new content", async () => {
      (api.call as Mock).mockResolvedValueOnce({
        data: { moduleContents: [] },
        error: null,
      });

      const { result } = renderHook(() =>
        useContentEditorData({
          isNew: true,
          contentId: null,
          moduleId: "module-1",
          onBack: mockOnBack,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.release).toEqual({
        release_type: "immediate",
        days_after_purchase: null,
        fixed_date: null,
        after_content_id: null,
      });
    });
  });

  describe("edit content mode", () => {
    it("should fetch existing content", async () => {
      const mockContent = {
        title: "Test Lesson",
        content_url: "https://youtube.com/watch?v=123",
        body: "<p>Content body</p>",
      };

      const mockAttachments: ContentAttachment[] = [
        {
          id: "att-1",
          content_id: "content-1",
          file_name: "document.pdf",
          file_url: "https://example.com/doc.pdf",
          file_type: "application/pdf",
          file_size: 1024,
          position: 0,
          created_at: new Date().toISOString(),
        },
      ];

      const mockRelease = {
        release_type: "days_after_purchase",
        days_after_purchase: 7,
        fixed_date: null,
        after_content_id: null,
      };

      (api.call as Mock).mockResolvedValueOnce({
        data: {
          content: mockContent,
          attachments: mockAttachments,
          release: mockRelease,
          moduleContents: [{ id: "c1", title: "Lesson 1" }],
        },
        error: null,
      });

      const { result } = renderHook(() =>
        useContentEditorData({
          isNew: false,
          contentId: "content-1",
          moduleId: "module-1",
          onBack: mockOnBack,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.content.title).toBe("Test Lesson");
      expect(result.current.content.video_url).toBe("https://youtube.com/watch?v=123");
      expect(result.current.attachments).toHaveLength(1);
      expect(result.current.release.release_type).toBe("days_after_purchase");
    });

    it("should load module contents for after_content selection", async () => {
      const mockModuleContents = [
        { id: "c1", title: "Lesson 1" },
        { id: "c2", title: "Lesson 2" },
      ];

      (api.call as Mock).mockResolvedValueOnce({
        data: {
          moduleContents: mockModuleContents,
          content: { title: "Test", content_url: null, body: null },
        },
        error: null,
      });

      const { result } = renderHook(() =>
        useContentEditorData({
          isNew: false,
          contentId: "content-1",
          moduleId: "module-1",
          onBack: mockOnBack,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.moduleContents).toHaveLength(2);
      expect(result.current.moduleContents[0].title).toBe("Lesson 1");
    });
  });

  describe("error handling", () => {
    it("should call onBack on error", async () => {
      (api.call as Mock).mockResolvedValueOnce({
        data: null,
        error: { message: "Failed to load" },
      });

      renderHook(() =>
        useContentEditorData({
          isNew: false,
          contentId: "content-1",
          moduleId: "module-1",
          onBack: mockOnBack,
        })
      );

      await waitFor(() => {
        expect(mockOnBack).toHaveBeenCalled();
      });
    });
  });

  describe("setters", () => {
    it("should expose setContent", async () => {
      (api.call as Mock).mockResolvedValueOnce({
        data: { moduleContents: [] },
        error: null,
      });

      const { result } = renderHook(() =>
        useContentEditorData({
          isNew: true,
          contentId: null,
          moduleId: "module-1",
          onBack: mockOnBack,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setContent({ title: "Updated", video_url: null, body: null });
      });

      expect(result.current.content.title).toBe("Updated");
    });

    it("should expose setRelease", async () => {
      (api.call as Mock).mockResolvedValueOnce({
        data: { moduleContents: [] },
        error: null,
      });

      const { result } = renderHook(() =>
        useContentEditorData({
          isNew: true,
          contentId: null,
          moduleId: "module-1",
          onBack: mockOnBack,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setRelease({
          release_type: "fixed_date",
          days_after_purchase: null,
          fixed_date: "2025-06-01",
          after_content_id: null,
        });
      });

      expect(result.current.release.release_type).toBe("fixed_date");
    });

    it("should expose setAttachments", async () => {
      (api.call as Mock).mockResolvedValueOnce({
        data: { moduleContents: [] },
        error: null,
      });

      const { result } = renderHook(() =>
        useContentEditorData({
          isNew: true,
          contentId: null,
          moduleId: "module-1",
          onBack: mockOnBack,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newAttachment: ContentAttachment = {
        id: "new-att",
        content_id: "content-1",
        file_name: "new.pdf",
        file_url: "https://example.com/new.pdf",
        file_type: "application/pdf",
        file_size: 2048,
        position: 0,
        created_at: new Date().toISOString(),
      };

      act(() => {
        result.current.setAttachments([newAttachment]);
      });

      expect(result.current.attachments).toHaveLength(1);
      expect(result.current.attachments[0].file_name).toBe("new.pdf");
    });
  });
});
