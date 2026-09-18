/**
 * Model Context Protocol (MCP) TypeScript Definitions
 * Standard 2024-11-05 Specification
 * Compatible with Claude Custom Connectors and ChatGPT Custom MCP Apps
 */

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: any;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

export interface McpToolInputSchema {
  type: "object";
  properties: Record<string, {
    type: string;
    description: string;
    enum?: string[];
    items?: any;
    default?: any;
  }>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface McpTool {
  name: string;
  description: string;
  category: "finance" | "goals" | "habits" | "calendar" | "study" | "family" | "crm";
  type: "read" | "write";
  inputSchema: McpToolInputSchema;
}

export interface McpTextContent {
  type: "text";
  text: string;
}

export interface McpToolResult {
  content: McpTextContent[];
  isError?: boolean;
  structuredContent?: Record<string, any>;
}

export interface AuthenticatedUser {
  userId: string;
  email?: string;
  role?: string;
  authMethod: "supabase_jwt" | "l4b_mcp_key";
}
