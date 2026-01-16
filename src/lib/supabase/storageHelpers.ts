/**
 * Storage Helpers
 * 
 * Utilities for storage path parsing and operations
 * All storage operations delegated to storageProxy for RISE Protocol V2 compliance
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { copyViaEdge, uploadViaEdge, listViaEdge, removeViaEdge } from "@/lib/storage/storageProxy";

/**
 * Generate a slug from a string
 * Simplified version for local use - full version in Edge Functions
 */
function toSlug(input: string): string {
  return (input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

const PUBLIC_RE = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;

export function parsePublicStorageUrl(url?: string): { bucket: string; path: string } | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const match = u.pathname.match(PUBLIC_RE);
    if (!match) return null;
    return { bucket: match[1], path: match[2] };
  } catch {
    return null;
  }
}

export function buildNewObjectPath(productId: number | string, originalPath: string, baseName: string) {
  const ext = originalPath.split(".").pop() || "bin";
  const safeBase = toSlug(baseName || "asset");
  const id = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return `checkouts/${productId}/${safeBase}/${id}.${ext}`;
}

export async function copyPublicObjectToNewPath(
  _supabase: SupabaseClient,
  originalUrl: string,
  productId: number | string,
  baseName: string
): Promise<string> {
  const parsed = parsePublicStorageUrl(originalUrl);
  if (!parsed) return originalUrl;

  const { bucket, path } = parsed;
  const newPath = buildNewObjectPath(productId, path, baseName);

  // Try to copy via Edge Function
  const copyResult = await copyViaEdge(bucket, path, newPath);
  if (!copyResult.error && copyResult.publicUrl) {
    return copyResult.publicUrl;
  }

  // Fallback: download and re-upload via Edge Function
  try {
    const resp = await fetch(originalUrl);
    if (!resp.ok) return originalUrl;
    const blob = await resp.blob();
    
    const uploadResult = await uploadViaEdge(bucket, newPath, blob, {
      upsert: false,
      contentType: blob.type || "application/octet-stream",
    });
    
    if (uploadResult.error || !uploadResult.publicUrl) return originalUrl;
    return uploadResult.publicUrl;
  } catch {
    return originalUrl;
  }
}

export async function removeAllUnderPrefix(_supabase: SupabaseClient, bucket: string, prefix: string) {
  const toDelete: string[] = [];
  let page = 0;
  
  while (true) {
    const { files, error } = await listViaEdge(bucket, prefix, {
      limit: 1000,
      offset: page * 1000,
    });
    
    if (error || !files?.length) break;

    for (const entry of files) {
      if (entry?.name) {
        const metadata = entry.metadata as { size?: number } | undefined;
        if (metadata?.size !== undefined && metadata.size >= 0) {
          toDelete.push(`${prefix}/${entry.name}`);
        } else {
          await removeAllUnderPrefix(_supabase, bucket, `${prefix}/${entry.name}`);
        }
      }
    }
    if (files.length < 1000) break;
    page++;
  }
  
  if (toDelete.length) {
    for (let i = 0; i < toDelete.length; i += 1000) {
      await removeViaEdge(bucket, toDelete.slice(i, i + 1000));
    }
  }
}
