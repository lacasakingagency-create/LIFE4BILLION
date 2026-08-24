import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient(req: any) {
  const headerUrl = req.headers["x-supabase-url"] as string;
  const headerKey = req.headers["x-supabase-anon-key"] as string;
  const envUrl = process.env.SUPABASE_URL || "";
  const envKey = process.env.SUPABASE_ANON_KEY || "";
  const url = headerUrl || envUrl || "";
  const key = headerKey || envKey || "";

  if (!url || !key) {
    return { client: null, url: "", configured: false };
  }
  try {
    const client = createClient(url, key);
    return { client, url, configured: true };
  } catch (err: any) {
    return { client: null, url, configured: true };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Configuration
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-supabase-url, x-supabase-anon-key"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(455).json({
      success: false,
      error: `Method ${req.method} Not Allowed`
    });
  }

  const { client } = getSupabaseClient(req);
  if (!client) {
    return res.status(500).json({ 
      success: false, 
      error: "Supabase client is not configured or failed to initialize." 
    });
  }

  try {
    let { data, error } = await client
      .from("life4billion_store")
      .select("*");

    if (error) {
      // Fallback check on omnisaas_store for backwards compatibility
      const fallback = await client.from("omnisaas_store").select("*");
      if (!fallback.error) {
        data = fallback.data;
        error = null;
      }
    }

    if (error) {
      const isMissingTable = 
        error.code === '42P01' || 
        error.code === 'PGRST116' || 
        error.message?.toLowerCase().includes('does not exist') || 
        error.message?.toLowerCase().includes('schema cache') ||
        error.message?.toLowerCase().includes('could not find the table');

      if (isMissingTable) {
        return res.status(404).json({
          success: false,
          needsInitialization: true,
          error: "A tabela 'life4billion_store' não existe no banco de dados."
        });
      }
      throw error;
    }

    const storeMap: Record<string, any> = {};
    if (data) {
      for (const item of data) {
        storeMap[item.key] = item.value;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Pull de sincronização realizado com sucesso!",
      data: storeMap
    });

  } catch (err: any) {
    console.error("[Supabase Pull Exception]:", err);
    return res.status(500).json({ success: false, error: err.message || err });
  }
}
