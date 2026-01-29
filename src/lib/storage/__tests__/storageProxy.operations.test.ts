/**
 * Storage Proxy Operations Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for file management storage operations:
 * - removeViaEdge: Delete files from storage
 * - listViaEdge: List files in a prefix
 * - copyViaEdge: Copy files between paths
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { removeViaEdge, listViaEdge, copyViaEdge } from "../storageProxy";

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

describe("StorageProxy - File Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

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

    it("should handle exceptions gracefully", async () => {
      mockApiCall.mockRejectedValue(new Error("Network failure"));

      const result = await removeViaEdge("bucket", ["file.png"]);

      expect(result.error?.message).toBe("Network failure");
    });
  });

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

    it("should handle exceptions gracefully", async () => {
      mockApiCall.mockRejectedValue(new Error("Timeout"));

      const result = await listViaEdge("bucket", "prefix/");

      expect(result.files).toBeNull();
      expect(result.error?.message).toBe("Timeout");
    });
  });

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

    it("should handle error from response data", async () => {
      mockApiCall.mockResolvedValue({
        data: { error: "Source file not found" },
        error: null,
      });

      const result = await copyViaEdge("bucket", "missing.png", "copy.png");

      expect(result.error?.message).toBe("Source file not found");
    });

    it("should handle API error", async () => {
      mockApiCall.mockResolvedValue({
        data: null,
        error: { message: "Copy operation failed" },
      });

      const result = await copyViaEdge("bucket", "source.png", "dest.png");

      expect(result.error?.message).toBe("Copy operation failed");
    });

    it("should handle exceptions gracefully", async () => {
      mockApiCall.mockRejectedValue(new Error("Connection refused"));

      const result = await copyViaEdge("bucket", "source.png", "dest.png");

      expect(result.error?.message).toBe("Connection refused");
    });
  });
});
