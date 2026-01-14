/**
 * Supabase Storage Utilities
 * 
 * All operations delegated to storageProxy for RISE Protocol V2 compliance
 */

import { copyImageFromUrl, removeViaEdge } from "@/lib/storage/storageProxy";

export async function copyImagePublicUrlToNewFile(publicUrl: string, destFolder = "product-images") {
  if (!publicUrl || !publicUrl.startsWith("http")) return null;

  const result = await copyImageFromUrl(publicUrl, destFolder);
  if (result.error) throw result.error;
  
  return { publicUrl: result.publicUrl, path: result.path };
}

export async function deleteStorageFiles(paths: string[], bucket = "product-images") {
  if (!paths || paths.length === 0) return { error: null };
  
  const result = await removeViaEdge(bucket, paths);
  return { error: result.error };
}
