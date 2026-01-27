/**
 * Storage Management Edge Function
 * 
 * Centralizes storage operations from frontend, providing:
 * - Ownership validation
 * - Secure upload/remove operations
 * - Path validation
 * 
 * @version 3.0.0 - RISE Protocol V3 (unified-auth)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { getAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("StorageManagement");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Allowed buckets for operations
const ALLOWED_BUCKETS = ["product-images", "avatars", "documents"];

interface UploadRequest {
  action: "upload";
  bucket: string;
  path: string;
  fileData: string; // base64 encoded
  contentType: string;
  upsert?: boolean;
}

interface RemoveRequest {
  action: "remove";
  bucket: string;
  paths: string[];
}

interface ListRequest {
  action: "list";
  bucket: string;
  prefix: string;
  limit?: number;
  offset?: number;
}

interface CopyRequest {
  action: "copy";
  bucket: string;
  sourcePath: string;
  destPath: string;
}

type StorageRequest = UploadRequest | RemoveRequest | ListRequest | CopyRequest;

Deno.serve(async (req) => {
  // Handle CORS
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Auth via unified-auth
    const producer = await getAuthenticatedProducer(supabase, req);
    
    if (!producer) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json() as StorageRequest;
    const { action } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ error: "Action is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate bucket
    const bucket = "bucket" in body ? body.bucket : null;
    if (bucket && !ALLOWED_BUCKETS.includes(bucket)) {
      return new Response(
        JSON.stringify({ error: `Bucket '${bucket}' is not allowed` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case "upload": {
        const { path, fileData, contentType, upsert = false } = body as UploadRequest;
        
        if (!path || !fileData || !contentType) {
          return new Response(
            JSON.stringify({ error: "path, fileData, and contentType are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validate path starts with producer ID or is in allowed pattern
        const isOwnerPath = path.startsWith(`${producer.id}/`);
        const isProductPath = path.startsWith("products/");
        
        if (!isOwnerPath && !isProductPath) {
          return new Response(
            JSON.stringify({ error: "Path must start with user ID or 'products/'" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Decode base64
        const base64Data = fileData.split(",").pop() || fileData;
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        const { data, error } = await supabase.storage
          .from(bucket!)
          .upload(path, binaryData, {
            contentType,
            upsert,
          });

        if (error) {
          log.error("Upload error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from(bucket!).getPublicUrl(path);

        return new Response(
          JSON.stringify({ 
            success: true, 
            path: data.path,
            publicUrl: urlData.publicUrl 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "remove": {
        const { paths } = body as RemoveRequest;
        
        if (!paths || !Array.isArray(paths) || paths.length === 0) {
          return new Response(
            JSON.stringify({ error: "paths array is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validate all paths are owned by producer or in products folder
        for (const path of paths) {
          const isOwnerPath = path.startsWith(`${producer.id}/`);
          const isProductPath = path.startsWith("products/");
          
          if (!isOwnerPath && !isProductPath) {
            return new Response(
              JSON.stringify({ error: `Path '${path}' is not authorized for deletion` }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        const { error } = await supabase.storage.from(bucket!).remove(paths);

        if (error) {
          log.error("Remove error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list": {
        const { prefix, limit = 100, offset = 0 } = body as ListRequest;
        
        if (!prefix) {
          return new Response(
            JSON.stringify({ error: "prefix is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validate prefix starts with producer ID or products folder
        const isOwnerPath = prefix.startsWith(`${producer.id}/`);
        const isProductPath = prefix.startsWith("products/");
        
        if (!isOwnerPath && !isProductPath) {
          return new Response(
            JSON.stringify({ error: "Prefix must start with user ID or 'products/'" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase.storage
          .from(bucket!)
          .list(prefix, { limit, offset });

        if (error) {
          log.error("List error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, files: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "copy": {
        const { sourcePath, destPath } = body as CopyRequest;
        
        if (!sourcePath || !destPath) {
          return new Response(
            JSON.stringify({ error: "sourcePath and destPath are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validate destination path
        const isOwnerPath = destPath.startsWith(`${producer.id}/`);
        const isProductPath = destPath.startsWith("products/");
        
        if (!isOwnerPath && !isProductPath) {
          return new Response(
            JSON.stringify({ error: "Destination path must start with user ID or 'products/'" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase.storage
          .from(bucket!)
          .copy(sourcePath, destPath);

        if (error) {
          log.error("Copy error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get public URL of new file
        const { data: urlData } = supabase.storage.from(bucket!).getPublicUrl(destPath);

        return new Response(
          JSON.stringify({ success: true, publicUrl: urlData.publicUrl }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (err) {
    log.error("Exception:", err);
    // RISE V3: Use dynamic corsHeaders when available, fallback to empty for uncaught errors
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
