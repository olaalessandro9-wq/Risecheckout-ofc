/**
 * Storage Proxy - Centralized Storage operations via Edge Function
 * 
 * All storage operations go through this utility.
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @see supabase/functions/storage-management/index.ts
 */

import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const log = createLogger("StorageProxy");

// ============================================
// Utility Functions
// ============================================

/**
 * Converts a File or Blob to base64 string
 */
async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface StorageResponse {
  publicUrl?: string | null;
  path?: string | null;
  files?: Array<{ name: string; metadata?: Record<string, unknown> }>;
  error?: string;
}

// ============================================
// Core Storage Operations
// ============================================

export interface UploadResult {
  publicUrl: string | null;
  path: string | null;
  error: Error | null;
}

export interface RemoveResult {
  error: Error | null;
}

export interface ListResult {
  files: Array<{ name: string; metadata?: Record<string, unknown> }> | null;
  error: Error | null;
}

export interface CopyResult {
  publicUrl: string | null;
  error: Error | null;
}

/**
 * Uploads a file via the storage-management Edge Function
 * 
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @param file - File or Blob to upload
 * @param options - Upload options (upsert, contentType)
 * @returns Promise with publicUrl and path or error
 */
export async function uploadViaEdge(
  bucket: string,
  path: string,
  file: File | Blob,
  options?: { upsert?: boolean; contentType?: string }
): Promise<UploadResult> {
  try {
    const base64 = await fileToBase64(file);
    const contentType = options?.contentType || 
      (file instanceof File ? file.type : "application/octet-stream");

    const { data, error } = await api.call<StorageResponse>("storage-management", {
      action: "upload",
      bucket,
      path,
      fileData: base64,
      contentType,
      upsert: options?.upsert ?? true,
    });

    if (error) {
      log.error("Upload error:", error);
      return { publicUrl: null, path: null, error: new Error(error.message) };
    }

    if (data?.error) {
      return { publicUrl: null, path: null, error: new Error(data.error) };
    }

    return { 
      publicUrl: data?.publicUrl || null, 
      path: data?.path || path, 
      error: null 
    };
  } catch (err) {
    log.error("Upload exception:", err);
    return { publicUrl: null, path: null, error: err as Error };
  }
}

/**
 * Removes files via the storage-management Edge Function
 * 
 * @param bucket - Storage bucket name
 * @param paths - Array of file paths to remove
 * @returns Promise with error or null
 */
export async function removeViaEdge(
  bucket: string,
  paths: string[]
): Promise<RemoveResult> {
  if (!paths || paths.length === 0) {
    return { error: null };
  }

  try {
    const { data, error } = await api.call<StorageResponse>("storage-management", {
      action: "remove", bucket, paths,
    });

    if (error) {
      log.error("Remove error:", error);
      return { error: new Error(error.message) };
    }

    if (data?.error) {
      return { error: new Error(data.error) };
    }

    return { error: null };
  } catch (err) {
    log.error("Remove exception:", err);
    return { error: err as Error };
  }
}

/**
 * Lists files via the storage-management Edge Function
 * 
 * @param bucket - Storage bucket name
 * @param prefix - Path prefix to filter files
 * @param options - List options (limit, offset)
 * @returns Promise with files array or error
 */
export async function listViaEdge(
  bucket: string,
  prefix: string,
  options?: { limit?: number; offset?: number }
): Promise<ListResult> {
  try {
    const { data, error } = await api.call<StorageResponse>("storage-management", {
      action: "list", bucket, prefix, ...options,
    });

    if (error) {
      log.error("List error:", error);
      return { files: null, error: new Error(error.message) };
    }

    if (data?.error) {
      return { files: null, error: new Error(data.error) };
    }

    return { files: data?.files || [], error: null };
  } catch (err) {
    log.error("List exception:", err);
    return { files: null, error: err as Error };
  }
}

/**
 * Copies a file via the storage-management Edge Function
 * 
 * @param bucket - Storage bucket name
 * @param fromPath - Source file path
 * @param toPath - Destination file path
 * @returns Promise with publicUrl or error
 */
export async function copyViaEdge(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<CopyResult> {
  try {
    const { data, error } = await api.call<StorageResponse>("storage-management", {
      action: "copy", bucket, fromPath, toPath,
    });

    if (error) {
      log.error("Copy error:", error);
      return { publicUrl: null, error: new Error(error.message) };
    }

    if (data?.error) {
      return { publicUrl: null, error: new Error(data.error) };
    }

    return { publicUrl: data?.publicUrl || null, error: null };
  } catch (err) {
    log.error("Copy exception:", err);
    return { publicUrl: null, error: err as Error };
  }
}

// ============================================
// High-Level Helpers
// ============================================

/**
 * Uploads an image file and returns the public URL
 * Convenience wrapper for common image upload pattern
 */
export async function uploadImage(
  file: File,
  folder: string,
  productId?: string
): Promise<{ publicUrl: string | null; error: Error | null }> {
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const path = productId 
    ? `${productId}/${folder}/${fileName}`
    : `${folder}/${fileName}`;

  const result = await uploadViaEdge("product-images", path, file, { upsert: true });
  return { publicUrl: result.publicUrl, error: result.error };
}

/**
 * Copies an image from a public URL to a new path in storage
 * Useful for duplicating checkout assets
 */
export async function copyImageFromUrl(
  publicUrl: string,
  destFolder: string
): Promise<{ publicUrl: string | null; path: string | null; error: Error | null }> {
  if (!publicUrl || !publicUrl.startsWith("http")) {
    return { publicUrl: null, path: null, error: new Error("Invalid URL") };
  }

  try {
    // Download the image
    const res = await window.fetch(publicUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch image: ${res.status}`);
    }

    const blob = await res.blob();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = (contentType.split("/")[1] || "jpg").split(";")[0];
    const fileName = `${destFolder}/${crypto.randomUUID()}.${ext}`;

    const result = await uploadViaEdge("product-images", fileName, blob, {
      contentType,
      upsert: true,
    });

    return { publicUrl: result.publicUrl, path: result.path, error: result.error };
  } catch (err) {
    log.error("copyImageFromUrl error:", err);
    return { publicUrl: null, path: null, error: err as Error };
  }
}
