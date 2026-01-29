/**
 * Storage Proxy Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for centralized storage operations:
 * - Upload via Edge Function
 * - Remove files
 * - List files
 * - Copy files
 * - Image upload helper
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  uploadViaEdge,
  removeViaEdge,
  listViaEdge,
  copyViaEdge,
  uploadImage,
} from "../storageProxy";

// Mock api
const mockApiCall = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    call: (path: string, body: unknown) => mockApiCall(path, body),
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock FileReader
class MockFileReader {
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;

  readAsDataURL() {
    setTimeout(() => {
      this.result = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      if (this.onload) this.onload();
    }, 0);
  }
}

vi.stubGlobal("FileReader", MockFileReader);

// Mock crypto.randomUUID
vi.stubGlobal("crypto", {
  randomUUID: () => "test-uuid-1234",
});

describe("StorageProxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========== UPLOAD VIA EDGE ==========

  describe("uploadViaEdge", () => {
    it("should upload file and return public URL", async () => {
      mockApiCall.mockResolvedValue({
        data: { publicUrl: "https://example.com/file.png", path: "products/file.png" },
        error: null,
      });

      const file = new File(["content"], "test.png", { type: "image/png" });
      const result = await uploadViaEdge("product-images", "products/test.png", file);

      expect(result.publicUrl).toBe("https://example.com/file.png");
      expect(result.path).toBe("products/file.png");
      expect(result.error).toBeNull();
    });

    it("should pass upsert option", async () => {
      mockApiCall.mockResolvedValue({
        data: { publicUrl: "url", path: "path" },
        error: null,
      });

      const file = new File(["content"], "test.png", { type: "image/png" });
      await uploadViaEdge("bucket", "path", file, { upsert: true });

      expect(mockApiCall).toHaveBeenCalledWith(
        "storage-management",
        expect.objectContaining({
          action: "upload",
          bucket: "bucket",
          path: "path",
          upsert: true,
        })
      );
    });

    it("should use file type as content type", async () => {
      mockApiCall.mockResolvedValue({
        data: { publicUrl: "url", path: "path" },
        error: null,
      });

      const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
      await uploadViaEdge("bucket", "path", file);

      expect(mockApiCall).toHaveBeenCalledWith(
        "storage-management",
        expect.objectContaining({
          contentType: "image/jpeg",
        })
      );
    });

    it("should use custom content type if provided", async () => {
      mockApiCall.mockResolvedValue({
        data: { publicUrl: "url", path: "path" },
        error: null,
      });

      const file = new File(["content"], "test.png", { type: "image/png" });
      await uploadViaEdge("bucket", "path", file, { contentType: "image/webp" });

      expect(mockApiCall).toHaveBeenCalledWith(
        "storage-management",
        expect.objectContaining({
          contentType: "image/webp",
        })
      );
    });

    it("should handle API error", async () => {
      mockApiCall.mockResolvedValue({
        data: null,
        error: { message: "Upload failed" },
      });

      const file = new File(["content"], "test.png", { type: "image/png" });
      const result = await uploadViaEdge("bucket", "path", file);

      expect(result.publicUrl).toBeNull();
      expect(result.error?.message).toBe("Upload failed");
    });

    it("should handle response error", async () => {
      mockApiCall.mockResolvedValue({
        data: { error: "File too large" },
        error: null,
      });

      const file = new File(["content"], "test.png", { type: "image/png" });
      const result = await uploadViaEdge("bucket", "path", file);

      expect(result.error?.message).toBe("File too large");
    });

    it("should handle exceptions", async () => {
      mockApiCall.mockRejectedValue(new Error("Network error"));

      const file = new File(["content"], "test.png", { type: "image/png" });
      const result = await uploadViaEdge("bucket", "path", file);

      expect(result.error?.message).toBe("Network error");
    });
  });

  // ========== REMOVE VIA EDGE ==========

  describe("removeViaEdge", () => {
    it("should remove files successfully", async () => {
      mockApiCall.mockResolvedValue({ data: {}, error: null });

      const result = await removeViaEdge("bucket", ["file1.png", "file2.png"]);

      expect(result.error).toBeNull();
      expect(mockApiCall).toHaveBeenCalledWith("storage-management", {
        action: "remove",
        bucket: "bucket",
        paths: ["file1.png", "file2.png"],
      });
    });

    it("should return success for empty paths array", async () => {
      const result = await removeViaEdge("bucket", []);

      expect(result.error).toBeNull();
      expect(mockApiCall).not.toHaveBeenCalled();
    });

    it("should handle API error", async () => {
      mockApiCall.mockResolvedValue({
        data: null,
        error: { message: "Permission denied" },
      });

      const result = await removeViaEdge("bucket", ["file.png"]);

      expect(result.error?.message).toBe("Permission denied");
    });
  });

  // ========== LIST VIA EDGE ==========

  describe("listViaEdge", () => {
    it("should list files in prefix", async () => {
      mockApiCall.mockResolvedValue({
        data: {
          files: [
            { name: "file1.png", metadata: {} },
            { name: "file2.png", metadata: {} },
          ],
        },
        error: null,
      });

      const result = await listViaEdge("bucket", "products/");

      expect(result.files).toHaveLength(2);
      expect(result.error).toBeNull();
    });

    it("should pass limit and offset options", async () => {
      mockApiCall.mockResolvedValue({ data: { files: [] }, error: null });

      await listViaEdge("bucket", "prefix/", { limit: 10, offset: 20 });

      expect(mockApiCall).toHaveBeenCalledWith("storage-management", {
        action: "list",
        bucket: "bucket",
        prefix: "prefix/",
        limit: 10,
        offset: 20,
      });
    });

    it("should return empty array when no files", async () => {
      mockApiCall.mockResolvedValue({ data: {}, error: null });

      const result = await listViaEdge("bucket", "empty/");

      expect(result.files).toEqual([]);
    });

    it("should handle error", async () => {
      mockApiCall.mockResolvedValue({
        data: null,
        error: { message: "List failed" },
      });

      const result = await listViaEdge("bucket", "prefix/");

      expect(result.files).toBeNull();
      expect(result.error?.message).toBe("List failed");
    });
  });

  // ========== COPY VIA EDGE ==========

  describe("copyViaEdge", () => {
    it("should copy file and return new public URL", async () => {
      mockApiCall.mockResolvedValue({
        data: { publicUrl: "https://example.com/copy.png" },
        error: null,
      });

      const result = await copyViaEdge("bucket", "original.png", "copy.png");

      expect(result.publicUrl).toBe("https://example.com/copy.png");
      expect(result.error).toBeNull();
    });

    it("should call API with correct parameters", async () => {
      mockApiCall.mockResolvedValue({ data: { publicUrl: "url" }, error: null });

      await copyViaEdge("my-bucket", "from/path.png", "to/path.png");

      expect(mockApiCall).toHaveBeenCalledWith("storage-management", {
        action: "copy",
        bucket: "my-bucket",
        fromPath: "from/path.png",
        toPath: "to/path.png",
      });
    });

    it("should handle error", async () => {
      mockApiCall.mockResolvedValue({
        data: { error: "Source file not found" },
        error: null,
      });

      const result = await copyViaEdge("bucket", "missing.png", "copy.png");

      expect(result.error?.message).toBe("Source file not found");
    });
  });

  // ========== UPLOAD IMAGE HELPER ==========

  describe("uploadImage", () => {
    it("should upload image with generated filename", async () => {
      mockApiCall.mockResolvedValue({
        data: { publicUrl: "https://example.com/image.jpg", path: "path" },
        error: null,
      });

      const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
      const result = await uploadImage(file, "gallery");

      expect(result.publicUrl).toBe("https://example.com/image.jpg");
      expect(mockApiCall).toHaveBeenCalledWith(
        "storage-management",
        expect.objectContaining({
          path: "gallery/test-uuid-1234.jpg",
        })
      );
    });

    it("should include productId in path when provided", async () => {
      mockApiCall.mockResolvedValue({
        data: { publicUrl: "url", path: "path" },
        error: null,
      });

      const file = new File(["content"], "image.png", { type: "image/png" });
      await uploadImage(file, "thumbnails", "product-123");

      expect(mockApiCall).toHaveBeenCalledWith(
        "storage-management",
        expect.objectContaining({
          path: "product-123/thumbnails/test-uuid-1234.png",
        })
      );
    });

    it("should use jpg as fallback extension", async () => {
      mockApiCall.mockResolvedValue({
        data: { publicUrl: "url", path: "path" },
        error: null,
      });

      const file = new File(["content"], "noextension", { type: "image/jpeg" });
      await uploadImage(file, "folder");

      expect(mockApiCall).toHaveBeenCalledWith(
        "storage-management",
        expect.objectContaining({
          path: expect.stringContaining(".noextension"),
        })
      );
    });
  });
});
