/**
 * MCP JSON-RPC 2.0 Dispatcher
 * Core protocol state machine handling initialize, tools/list, tools/call, ping.
 * Enforces authentication, argument sanitization, and standards compliance.
 */

import { JsonRpcRequest, JsonRpcResponse, AuthenticatedUser } from "./types";
import { LIFE4BILLION_MCP_TOOLS, findMcpTool } from "./tools";
import { sanitizeToolArguments, createSupabaseClient, getSupabaseCredentials } from "./auth";
import { executeMcpTool } from "./handlers";

export async function dispatchMcpMessage(
  message: JsonRpcRequest,
  user: AuthenticatedUser | null,
  authError?: string,
  reqHeaders?: Record<string, any>
): Promise<JsonRpcResponse | null> {
  const reqId = message.id ?? null;

  // Validate JSON-RPC structure
  if (!message || typeof message !== "object" || message.jsonrpc !== "2.0" || !message.method) {
    return {
      jsonrpc: "2.0",
      id: reqId,
      error: {
        code: -32600,
        message: "Invalid Request: The JSON sent is not a valid JSON-RPC 2.0 Request object."
      }
    };
  }

  // Handle Notifications (messages without id)
  const isNotification = message.id === undefined;

  switch (message.method) {
    // 1. Handshake & Initialization
    case "initialize": {
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {
              listChanged: false
            }
          },
          serverInfo: {
            name: "life4billion-mcp",
            version: "1.0.0",
            title: "Life4Billion Remote MCP Server",
            description: "Servidor MCP Remoto Oficial do Life4Billion para Claude e ChatGPT. Gestão Financeira, Metas, Hábitos, Agenda, Estudos e CRM."
          }
        }
      };
    }

    case "notifications/initialized": {
      if (isNotification) return null;
      return { jsonrpc: "2.0", id: reqId, result: {} };
    }

    case "ping": {
      return { jsonrpc: "2.0", id: reqId, result: {} };
    }

    // 2. Tool Discovery
    case "tools/list": {
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          tools: LIFE4BILLION_MCP_TOOLS.map(t => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema
          }))
        }
      };
    }

    // 3. Tool Invocation
    case "tools/call": {
      const params = message.params || {};
      const toolName = params.name;
      const rawArgs = params.arguments || {};

      if (!toolName || typeof toolName !== "string") {
        return {
          jsonrpc: "2.0",
          id: reqId,
          error: {
            code: -32602,
            message: "Invalid params: 'name' is required for tools/call."
          }
        };
      }

      const tool = findMcpTool(toolName);
      if (!tool) {
        return {
          jsonrpc: "2.0",
          id: reqId,
          error: {
            code: -32601,
            message: `Method not found: Tool '${toolName}' does not exist on Life4Billion MCP server.`
          }
        };
      }

      // Authentication check for tools/call
      if (!user) {
        return {
          jsonrpc: "2.0",
          id: reqId,
          error: {
            code: -32000,
            message: authError || "Unauthorized: Valid Supabase authentication or Life4Billion MCP API Key required to execute tools."
          }
        };
      }

      // Security Check: detect any cross-user parameter spoofing
      const { sanitizedArgs, accessViolation } = sanitizeToolArguments(rawArgs, user.userId);
      if (accessViolation) {
        return {
          jsonrpc: "2.0",
          id: reqId,
          error: {
            code: -32001,
            message: "Security Violation: Cross-tenant data access denied. You cannot query or modify data belonging to another user."
          }
        };
      }

      // Prepare Supabase Client
      const config = getSupabaseCredentials(reqHeaders);
      const client = createSupabaseClient(config);
      if (!client) {
        return {
          jsonrpc: "2.0",
          id: reqId,
          error: {
            code: -32002,
            message: "Database Error: Supabase client could not be initialized on the server."
          }
        };
      }

      // Execute tool
      const toolResult = await executeMcpTool(toolName, sanitizedArgs, user, client);

      return {
        jsonrpc: "2.0",
        id: reqId,
        result: toolResult
      };
    }

    default: {
      return {
        jsonrpc: "2.0",
        id: reqId,
        error: {
          code: -32601,
          message: `Method not found: Unknown MCP method '${message.method}'. Supported methods: initialize, ping, tools/list, tools/call.`
        }
      };
    }
  }
}
