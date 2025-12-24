import { toSlug } from "@/lib/utils/slug";

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
  supabase: any,
  originalUrl: string,
  productId: number | string,
  baseName: string
): Promise<string> {
  const parsed = parsePublicStorageUrl(originalUrl);
  if (!parsed) return originalUrl;

  const { bucket, path } = parsed;
  const newPath = buildNewObjectPath(productId, path, baseName);

  // Tenta copiar no storage (server-side op suportada pelo Supabase)
  const copyRes = await supabase.storage.from(bucket).copy(path, newPath);
  if (!copyRes.error) {
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(newPath);
    return pub.publicUrl;
  }

  // Fallback: baixar e reenviar (client-side)
  const resp = await fetch(originalUrl);
  if (!resp.ok) return originalUrl;
  const blob = await resp.blob();
  const uploadRes = await supabase.storage.from(bucket).upload(newPath, blob, {
    upsert: false,
    contentType: blob.type || "application/octet-stream",
  });
  if (uploadRes.error) return originalUrl;
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(newPath);
  return pub.publicUrl;
}

export async function removeAllUnderPrefix(supabase: any, bucket: string, prefix: string) {
  const toDelete: string[] = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset: page * 1000,
      sortBy: { column: "name", order: "asc" },
    });
    if (error || !data?.length) break;

    for (const entry of data) {
      if (entry?.name) {
        if (entry?.metadata?.size >= 0) {
          toDelete.push(`${prefix}/${entry.name}`);
        } else {
          await removeAllUnderPrefix(supabase, bucket, `${prefix}/${entry.name}`);
        }
      }
    }
    if (data.length < 1000) break;
    page++;
  }
  if (toDelete.length) {
    for (let i = 0; i < toDelete.length; i += 1000) {
      await supabase.storage.from(bucket).remove(toDelete.slice(i, i + 1000));
    }
  }
}
