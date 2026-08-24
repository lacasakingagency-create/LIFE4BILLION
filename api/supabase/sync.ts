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
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-supabase-url, x-supabase-anon-key"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
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

  const { data } = req.body || {};
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ success: false, error: "Payload inválido para sincronização." });
  }

  try {
    const syncedKeys: string[] = [];
    
    let tableName = "life4billion_store";
    // Quick test if life4billion_store exists, otherwise try omnisaas_store
    const testCheck = await client.from("life4billion_store").select("key").limit(1);
    if (testCheck.error) {
      const fallbackCheck = await client.from("omnisaas_store").select("key").limit(1);
      if (!fallbackCheck.error) {
        tableName = "omnisaas_store";
      }
    }

    for (const [key, val] of Object.entries(data)) {
      const { error } = await client
        .from(tableName)
        .upsert({ 
          key, 
          value: val, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'key' });

      if (error) {
        console.error(`[Supabase Push Error] key "${key}":`, error);
        
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
            error: "A tabela 'life4billion_store' não existe no banco de dados.",
            sql: `CREATE TABLE life4billion_store (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE life4billion_store ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para todos" ON life4billion_store FOR ALL USING (true) WITH CHECK (true);`
          });
        }
        throw error;
      }
      syncedKeys.push(key);
    }

    return res.status(200).json({
      success: true,
      message: "Push de sincronização realizado com sucesso!",
      syncedKeys
    });

  } catch (err: any) {
    console.error("[Supabase Push Exception]:", err);
    return res.status(500).json({ success: false, error: err.message || err });
  }
}
