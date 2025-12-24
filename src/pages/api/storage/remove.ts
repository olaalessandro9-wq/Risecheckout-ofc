import { supabase } from "@/integrations/supabase/client"; // ajustar se necessário

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { paths, bucket = "product-images" } = req.body || {};
  if (!Array.isArray(paths) || paths.length === 0) {
    return res.status(400).json({ error: "paths (array) is required" });
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) {
      console.error("Supabase remove error:", error);
      return res.status(500).json({ error: error.message || error });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Error in /api/storage/remove:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
