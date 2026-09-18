/**
 * MCP Remote Authentication & Strict User Data Isolation
 * Verifies Supabase Auth JWT or Life4Billion Personal MCP Keys.
 * Strictly prevents user_id spoofing or cross-tenant data access.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AuthenticatedUser } from "./types";

interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export function getSupabaseCredentials(reqHeaders?: Record<string, any>): SupabaseConfig {
  const envUrl = process.env.SUPABASE_URL || "";
  const envKey = process.env.SUPABASE_ANON_KEY || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  const headerUrl = reqHeaders?.["x-supabase-url"] as string;
  const headerKey = reqHeaders?.["x-supabase-anon-key"] as string;

  return {
    url: (headerUrl || envUrl).trim(),
    anonKey: (headerKey || envKey).trim(),
    serviceRoleKey: serviceKey.trim()
  };
}

export function createSupabaseClient(config: SupabaseConfig, token?: string): SupabaseClient | null {
  if (!config.url || !config.anonKey) {
    return null;
  }

  const options: any = {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  };

  if (token) {
    options.global = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  try {
    return createClient(config.url, config.anonKey, options);
  } catch (err) {
    console.error("[MCP Supabase Client Init Error]:", err);
    return null;
  }
}

/**
 * Validates credentials from incoming HTTP request.
 * Supports:
 * 1. Authorization: Bearer <Supabase_Auth_JWT>
 * 2. Authorization: Bearer l4b_mcp_<Personal_Access_Token>
 * 3. Header X-MCP-Key: ...
 * 4. Header X-Supabase-Auth: ...
 * 5. Query param token=... or api_key=...
 */
export async function authenticateMcpRequest(
  headers: Record<string, any>,
  query?: Record<string, any>
): Promise<{ user: AuthenticatedUser | null; error?: string }> {
  // 1. Extract raw token
  let rawToken = "";
  const authHeader = (headers["authorization"] || headers["Authorization"] || "") as string;
  if (authHeader.startsWith("Bearer ")) {
    rawToken = authHeader.substring(7).trim();
  } else if (authHeader.startsWith("Token ")) {
    rawToken = authHeader.substring(6).trim();
  } else if (headers["x-mcp-key"]) {
    rawToken = String(headers["x-mcp-key"]).trim();
  } else if (headers["x-supabase-auth"]) {
    rawToken = String(headers["x-supabase-auth"]).trim();
  } else if (query?.token) {
    rawToken = String(query.token).trim();
  } else if (query?.api_key) {
    rawToken = String(query.api_key).trim();
  }

  if (!rawToken) {
    return {
      user: null,
      error: "Authentication required: Missing Authorization Bearer token or X-MCP-Key header. Provide a valid Supabase JWT session or Life4Billion MCP API Key."
    };
  }

  const config = getSupabaseCredentials(headers);
  if (!config.url || !config.anonKey) {
    return {
      user: null,
      error: "Supabase configuration missing on server (SUPABASE_URL or SUPABASE_ANON_KEY not set)."
    };
  }

  // 2. Case A: Check if token is a Life4Billion Personal MCP Key (e.g. l4b_mcp_...)
  if (rawToken.startsWith("l4b_mcp_")) {
    const verifiedUser = await verifyPersonalMcpKey(rawToken, config);
    if (verifiedUser) {
      return { user: verifiedUser };
    }
    return {
      user: null,
      error: "Invalid or revoked Life4Billion MCP Key provided."
    };
  }

  // 3. Case B: Verify Supabase Auth JWT directly via auth.getUser(token)
  try {
    const client = createClient(config.url, config.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await client.auth.getUser(rawToken);

    if (error || !data?.user?.id) {
      // Fallback: check if the token might be an MCP Key that didn't have the prefix
      const keyUser = await verifyPersonalMcpKey(rawToken, config);
      if (keyUser) {
        return { user: keyUser };
      }

      return {
        user: null,
        error: `Supabase authentication failed: ${error?.message || "Invalid or expired token"}`
      };
    }

    const authUser = data.user;
    return {
      user: {
        userId: authUser.id,
        email: authUser.email || undefined,
        role: (authUser.app_metadata?.role as string) || (authUser.user_metadata?.role as string) || "user",
        authMethod: "supabase_jwt"
      }
    };
  } catch (err: any) {
    console.error("[MCP Auth Exception]:", err);
    return {
      user: null,
      error: `Authentication verification exception: ${err.message || String(err)}`
    };
  }
}

// In-memory MCP key cache for high resilience and instant local validation
export const IN_MEMORY_MCP_KEYS = new Map<string, { userId: string; email?: string; role?: string; createdAt: string }>();

/**
 * Verifies a Personal MCP Key stored in life4billion_store or in-memory cache
 */
async function verifyPersonalMcpKey(key: string, config: SupabaseConfig): Promise<AuthenticatedUser | null> {
  // 1. Check in-memory cache first
  const memoryKey = IN_MEMORY_MCP_KEYS.get(key);
  if (memoryKey) {
    return {
      userId: memoryKey.userId,
      email: memoryKey.email,
      role: memoryKey.role || "user",
      authMethod: "l4b_mcp_key"
    };
  }

  const serviceKey = config.serviceRoleKey || config.anonKey;
  if (!serviceKey) return null;

  try {
    const client = createClient(config.url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Check in life4billion_store for key "mcp_key_<key>"
    let { data, error } = await client
      .from("life4billion_store")
      .select("value, user_id")
      .eq("key", `mcp_api_key_${key}`)
      .maybeSingle();

    if (error || !data) {
      // Check in omnisaas_store fallback
      const fallback = await client
        .from("omnisaas_store")
        .select("value, user_id")
        .eq("key", `mcp_api_key_${key}`)
        .maybeSingle();

      if (!fallback.error && fallback.data) {
        data = fallback.data;
        error = null;
      }
    }

    if (data && data.user_id) {
      return {
        userId: data.user_id,
        email: data.value?.email,
        role: data.value?.role || "user",
        authMethod: "l4b_mcp_key"
      };
    }
  } catch (err) {
    console.warn("[Personal MCP Key Lookup Warning]:", err);
  }

  return null;
}

/**
 * Strict Security Guard: Ensures arguments passed to tools NEVER override the authenticated user ID.
 * If user_id is passed in tool arguments, it is checked and stripped/sanitized.
 * Any cross-user access attempt is explicitly rejected.
 */
export function sanitizeToolArguments(args: Record<string, any> | undefined, authenticatedUserId: string): {
  sanitizedArgs: Record<string, any>;
  accessViolation: boolean;
} {
  if (!args || typeof args !== "object") {
    return { sanitizedArgs: {}, accessViolation: false };
  }

  const sanitized = { ...args };

  // If a client/LLM tries to send a claimed user_id:
  if ("user_id" in sanitized) {
    const claimed = String(sanitized["user_id"]).trim();
    if (claimed && claimed !== authenticatedUserId) {
      // Explicit security violation
      return { sanitizedArgs: {}, accessViolation: true };
    }
    delete sanitized["user_id"];
  }

  if ("userId" in sanitized) {
    const claimed = String(sanitized["userId"]).trim();
    if (claimed && claimed !== authenticatedUserId) {
      return { sanitizedArgs: {}, accessViolation: true };
    }
    delete sanitized["userId"];
  }

  return { sanitizedArgs: sanitized, accessViolation: false };
}
