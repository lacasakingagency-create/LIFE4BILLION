/**
 * Life4Billion Remote MCP Server HTTP & SSE Transport Layer
 * Compatible with Claude Custom Connector and ChatGPT Custom MCP App.
 * Handles Streamable HTTP POST, Server-Sent Events (SSE), and Session Management.
 */

import { Request, Response } from "express";
import { authenticateMcpRequest, createSupabaseClient, getSupabaseCredentials, IN_MEMORY_MCP_KEYS } from "./auth";
import { dispatchMcpMessage } from "./dispatcher";
import { LIFE4BILLION_MCP_TOOLS } from "./tools";
import { JsonRpcRequest } from "./types";

// Active SSE sessions for clients using SSE transport
interface SseSession {
  id: string;
  res: Response;
  createdAt: number;
}
const activeSessions = new Map<string, SseSession>();

// Cleanup stale sessions periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of activeSessions.entries()) {
    if (now - session.createdAt > 30 * 60 * 1000) { // 30 min timeout
      try { session.res.end(); } catch {}
      activeSessions.delete(id);
    }
  }
}, 10 * 60 * 1000);

/**
 * Standard CORS headers for MCP clients (Claude, ChatGPT, Curl, Inspector)
 */
export function setMcpCorsHeaders(res: Response | any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-MCP-Key, X-Supabase-Auth, x-supabase-url, x-supabase-anon-key, Accept");
  res.setHeader("Access-Control-Expose-Headers", "Content-Type, Authorization");
}

/**
 * Main HTTP POST handler for MCP JSON-RPC 2.0 (/api/mcp)
 * Supports Streamable HTTP and direct JSON-RPC calls from Claude and ChatGPT.
 */
export async function handleMcpPost(req: Request | any, res: Response | any) {
  setMcpCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const body = req.body;
  if (!body) {
    return res.status(400).json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error: Empty request body." }
    });
  }

  // Authenticate the request
  const { user, error: authError } = await authenticateMcpRequest(req.headers || {}, req.query || {});

  // Handle batch requests vs single request
  if (Array.isArray(body)) {
    const responses = [];
    for (const msg of body) {
      const resp = await dispatchMcpMessage(msg as JsonRpcRequest, user, authError, req.headers);
      if (resp) responses.push(resp);
    }
    return res.status(200).json(responses);
  } else {
    const response = await dispatchMcpMessage(body as JsonRpcRequest, user, authError, req.headers);
    if (!response) {
      // Notification without return
      return res.status(204).end();
    }
    return res.status(200).json(response);
  }
}

/**
 * SSE Handshake handler for clients that negotiate SSE (/api/mcp/sse or GET /api/mcp with Accept: text/event-stream)
 */
export async function handleMcpSse(req: Request | any, res: Response | any) {
  setMcpCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Check if client expects JSON or metadata rather than SSE
  const acceptHeader = (req.headers["accept"] || "").toLowerCase();
  if (!acceptHeader.includes("text/event-stream")) {
    return handleMcpInfo(req, res);
  }

  const sessionId = "sess_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now().toString(36);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders?.();

  activeSessions.set(sessionId, {
    id: sessionId,
    res,
    createdAt: Date.now()
  });

  // 1. Send the endpoint event as per MCP SSE specification
  const messagesUri = `/api/mcp/messages?sessionId=${sessionId}`;
  res.write(`event: endpoint\ndata: ${messagesUri}\n\n`);

  // Heartbeat comment every 15 seconds to prevent timeout
  const keepAliveInterval = setInterval(() => {
    try {
      res.write(": keep-alive\n\n");
    } catch {
      clearInterval(keepAliveInterval);
      activeSessions.delete(sessionId);
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(keepAliveInterval);
    activeSessions.delete(sessionId);
  });
}

/**
 * Message receiver for SSE sessions (/api/mcp/messages?sessionId=...)
 */
export async function handleMcpMessages(req: Request | any, res: Response | any) {
  setMcpCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const sessionId = (req.query?.sessionId as string) || (req.body?.sessionId as string);
  const session = sessionId ? activeSessions.get(sessionId) : null;

  const { user, error: authError } = await authenticateMcpRequest(req.headers || {}, req.query || {});
  const body = req.body;

  if (!body) {
    return res.status(400).json({ error: "Empty request body" });
  }

  const rpcResponse = await dispatchMcpMessage(body as JsonRpcRequest, user, authError, req.headers);

  // If active SSE session exists, send via SSE stream
  if (session && rpcResponse) {
    try {
      session.res.write(`event: message\ndata: ${JSON.stringify(rpcResponse)}\n\n`);
      return res.status(202).json({ status: "delivered_via_sse" });
    } catch (err) {
      activeSessions.delete(sessionId);
    }
  }

  // Fallback: return direct JSON-RPC response
  if (rpcResponse) {
    return res.status(200).json(rpcResponse);
  }
  return res.status(204).end();
}

/**
 * Metadata & Info endpoint (/api/mcp or /api/mcp/info or /.well-known/mcp)
 * Provides machine-readable and human-readable discovery info for Claude and ChatGPT.
 */
export function handleMcpInfo(req: Request | any, res: Response | any) {
  setMcpCorsHeaders(res);

  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "life4billion.com";
  const baseUrl = `${protocol}://${host}`;

  const manifest = {
    name: "Life4Billion Remote MCP Server",
    version: "1.0.0",
    protocolVersion: "2024-11-05",
    description: "Official Remote Model Context Protocol (MCP) server for the Life4Billion Platform. Integrates with Claude Custom Connectors and ChatGPT Custom MCP Apps.",
    status: "online",
    endpoints: {
      mcp_endpoint: `${baseUrl}/api/mcp`,
      sse_endpoint: `${baseUrl}/api/mcp/sse`,
      messages_endpoint: `${baseUrl}/api/mcp/messages`,
      info_endpoint: `${baseUrl}/api/mcp/info`
    },
    authentication: {
      type: "Bearer",
      description: "Provide either a valid Supabase Auth JWT or a Life4Billion Personal MCP Key (l4b_mcp_...).",
      header: "Authorization: Bearer <token>",
      alternative_header: "X-MCP-Key: <token>"
    },
    tools_count: LIFE4BILLION_MCP_TOOLS.length,
    tools_summary: {
      finance: ["get_financial_summary", "get_income", "get_expenses", "get_monthly_expenses", "get_budget", "get_upcoming_bills", "get_emergency_reserve", "get_net_worth"],
      goals: ["get_goals", "create_goal", "update_goal"],
      habits: ["get_habits", "get_habit_progress", "create_habit", "update_habit"],
      calendar: ["get_calendar_events", "create_calendar_event"],
      study: ["get_study_progress", "get_study_sessions"],
      family: ["get_family_budget", "get_family_expenses"],
      crm: ["get_crm_summary", "get_leads", "get_customers"]
    },
    compatibility: {
      claude_connector: {
        type: "Remote MCP Server",
        url: `${baseUrl}/api/mcp`,
        auth: "Bearer Token (Supabase JWT or Life4Billion MCP Key)"
      },
      chatgpt_mcp_app: {
        type: "Custom MCP App / Actions",
        url: `${baseUrl}/api/mcp`,
        auth: "Bearer Token (Supabase JWT or Life4Billion MCP Key)"
      }
    }
  };

  return res.status(200).json(manifest);
}

/**
 * Helper to generate and store a persistent Personal MCP Key for a user in Supabase
 */
export async function generatePersonalMcpKey(
  userId: string,
  email?: string,
  reqHeaders?: Record<string, any>
): Promise<{ success: boolean; apiKey?: string; error?: string }> {
  if (!userId) {
    return { success: false, error: "User ID is required" };
  }

  const config = getSupabaseCredentials(reqHeaders);
  const client = createSupabaseClient(config);
  if (!client) {
    return { success: false, error: "Supabase client not configured" };
  }

  const randomSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const apiKey = `l4b_mcp_${randomSecret}`;

  // Store immediately in memory cache for 100% resilient access
  IN_MEMORY_MCP_KEYS.set(apiKey, {
    userId,
    email,
    role: "user",
    createdAt: new Date().toISOString()
  });

  if (client) {
    try {
      let tableName = "life4billion_store";
      const check = await client.from("life4billion_store").select("key").limit(1);
      if (check.error) {
        const fallbackCheck = await client.from("omnisaas_store").select("key").limit(1);
        if (!fallbackCheck.error) {
          tableName = "omnisaas_store";
        }
      }

      await client
        .from(tableName)
        .upsert({
          key: `mcp_api_key_${apiKey}`,
          value: {
            apiKey,
            userId,
            email: email || null,
            created_at: new Date().toISOString(),
            label: "Claude & ChatGPT MCP Key"
          },
          user_id: userId,
          updated_at: new Date().toISOString()
        }, { onConflict: "key" });
    } catch (err: any) {
      console.warn("[MCP Supabase Persistence Warning]:", err.message || err);
    }
  }

  return { success: true, apiKey };
}
