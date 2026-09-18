import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleMcpPost, handleMcpSse, handleMcpInfo, setMcpCorsHeaders } from "../src/server/mcp/server";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setMcpCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    const acceptHeader = (req.headers["accept"] || "").toLowerCase();
    if (acceptHeader.includes("text/event-stream")) {
      return handleMcpSse(req, res);
    }
    return handleMcpInfo(req, res);
  }

  if (req.method === "POST") {
    return handleMcpPost(req, res);
  }

  return res.status(405).json({ error: "Method not allowed. Use GET or POST." });
}
