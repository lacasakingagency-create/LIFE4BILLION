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

  const { client, url, configured } = getSupabaseClient(req);
  
  if (!configured) {
    return res.status(200).json({
      success: false,
      configured: false,
      connected: false,
      message: "Supabase não configurado no arquivo .env nem no Painel do Usuário."
    });
  }

  if (!client) {
    return res.status(200).json({
      success: false,
      configured: true,
      connected: false,
      message: "Cliente Supabase falhou ao carregar com as credenciais fornecidas"
    });
  }

  try {
    let { data, error } = await client
      .from("life4billion_store")
      .select("key")
      .limit(1);

    if (error) {
      const fallback = await client.from("omnisaas_store").select("key").limit(1);
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
        return res.status(200).json({
          success: true,
          configured: true,
          connected: true,
          tablesExist: false,
          message: "Conectado com sucesso, mas a tabela 'life4billion_store' precisa ser criada.",
          sql: `CREATE TABLE life4billion_store (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permissões básicas para ler/escrever dados
ALTER TABLE life4billion_store ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para todos" ON life4billion_store FOR ALL USING (true) WITH CHECK (true);`
        });
      }
      throw error;
    }

    return res.status(200).json({
      success: true,
      configured: true,
      connected: true,
      tablesExist: true,
      message: "Conectado ao Supabase com sucesso e tabela de armazenamento do Life4Billion ativa!",
      url: url
    });

  } catch (err: any) {
    return res.status(200).json({
      success: false,
      configured: true,
      connected: false,
      message: `Erro de conexão com o banco Supabase: ${err.message || err}`
    });
  }
}
