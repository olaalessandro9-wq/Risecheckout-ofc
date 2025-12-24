import { supabase } from "@/integrations/supabase/client";

export async function copyImagePublicUrlToNewFile(publicUrl: string, destFolder = "product-images") {
  if (!publicUrl || !publicUrl.startsWith("http")) return null;

  const res = await window.fetch(publicUrl);
  if (!res.ok) throw new Error(`Erro ao baixar imagem: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const contentType = res.headers.get("content-type") || "image/jpeg";
  const ext = (contentType.split("/")[1] || "jpg").split(";")[0];
  const fileName = `${destFolder}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(destFolder).upload(fileName, uint8Array, {
    contentType,
    upsert: true
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(destFolder).getPublicUrl(fileName);
  return { publicUrl: data?.publicUrl, path: fileName };
}

export async function deleteStorageFiles(paths: string[], bucket = "product-images") {
  if (!paths || paths.length === 0) return { error: null };
  const { error } = await supabase.storage.from(bucket).remove(paths);
  return { error };
}
