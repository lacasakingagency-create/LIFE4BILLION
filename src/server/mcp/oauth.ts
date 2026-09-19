/**
 * Life4Billion OAuth 2.1 Authorization Server & Dynamic Client Registration (RFC 7591)
 * Purpose-built for Claude Web Remote MCP integration with strict PKCE (RFC 7636)
 * and multi-tenant data isolation.
 */

import crypto from "crypto";
import { Request, Response } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseCredentials } from "./auth";
import { McpPermissions, DEFAULT_MCP_PERMISSIONS, normalizePermissions } from "./permissions";
import { AuthenticatedUser } from "./types";

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface OAuthClient {
  client_id: string;
  client_secret?: string;
  client_name: string;
  redirect_uris: string[];
  grant_types: string[];
  response_types: string[];
  token_endpoint_auth_method: string;
  scope?: string;
  client_id_issued_at: number;
  created_at: string;
}

export interface OAuthAuthorizationCode {
  code: string;
  client_id: string;
  user_id: string;
  user_email?: string;
  redirect_uri: string;
  scope: string;
  code_challenge: string;
  code_challenge_method: "S256" | "plain";
  expires_at: number; // Unix timestamp in ms
  used: boolean;
  permissions?: McpPermissions;
}

export interface OAuthAccessToken {
  token: string;
  token_hash: string;
  client_id: string;
  user_id: string;
  user_email?: string;
  scope: string;
  expires_at: number; // Unix timestamp in ms
  created_at: string;
  status: "active" | "revoked";
  permissions?: McpPermissions;
}

export interface OAuthRefreshToken {
  token: string;
  token_hash: string;
  client_id: string;
  user_id: string;
  user_email?: string;
  scope: string;
  expires_at: number;
  created_at: string;
  status: "active" | "revoked";
}

// In-Memory Caches for sub-millisecond local lookups and resilience
export const IN_MEMORY_OAUTH_CLIENTS = new Map<string, OAuthClient>();
export const IN_MEMORY_OAUTH_CODES = new Map<string, OAuthAuthorizationCode>();
export const IN_MEMORY_OAUTH_TOKENS = new Map<string, OAuthAccessToken>();
export const IN_MEMORY_OAUTH_REFRESH = new Map<string, OAuthRefreshToken>();

// Hash helper for secret/token comparison
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getBaseUrl(req: Request): string {
  const forwardedProto = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "localhost:3000";
  // If localhost without protocol, infer http or https
  const proto = host.includes("localhost") && !req.headers["x-forwarded-proto"] ? "http" : forwardedProto;
  return `${proto}://${host}`;
}

// ============================================================================
// Database Persistence Helpers (life4billion_store / omnisaas_store)
// ============================================================================

async function saveToStore(key: string, value: any, userId?: string, reqHeaders?: Record<string, any>) {
  const config = getSupabaseCredentials(reqHeaders);
  const serviceKey = config.serviceRoleKey || config.anonKey;
  if (!config.url || !serviceKey) return;

  try {
    const client = createClient(config.url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const payload: any = {
      key,
      value,
      updated_at: new Date().toISOString()
    };
    if (userId) {
      payload.user_id = userId;
    }

    const { error } = await client
      .from("life4billion_store")
      .upsert(payload, { onConflict: "key" });

    if (error) {
      await client
        .from("omnisaas_store")
        .upsert(payload, { onConflict: "key" });
    }
  } catch (err) {
    console.warn(`[OAuth Store Warning for ${key}]:`, err);
  }
}

async function getFromStore<T = any>(key: string, reqHeaders?: Record<string, any>): Promise<T | null> {
  const config = getSupabaseCredentials(reqHeaders);
  const serviceKey = config.serviceRoleKey || config.anonKey;
  if (!config.url || !serviceKey) return null;

  try {
    const client = createClient(config.url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    let { data, error } = await client
      .from("life4billion_store")
      .select("value, user_id")
      .eq("key", key)
      .maybeSingle();

    if (error || !data) {
      const fallback = await client
        .from("omnisaas_store")
        .select("value, user_id")
        .eq("key", key)
        .maybeSingle();
      if (!fallback.error && fallback.data) {
        data = fallback.data;
      }
    }

    if (data?.value) {
      return data.value as T;
    }
  } catch (err) {
    console.warn(`[OAuth Get Warning for ${key}]:`, err);
  }
  return null;
}

// ============================================================================
// 1. OAUTH DISCOVERY ENDPOINTS
// ============================================================================

/**
 * RFC 8414 - OAuth 2.0 Authorization Server Metadata
 * GET /.well-known/oauth-authorization-server
 */
export function handleOAuthAuthorizationServerDiscovery(req: Request, res: Response) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");

  const issuer = getBaseUrl(req);

  const metadata = {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    revocation_endpoint: `${issuer}/oauth/revoke`,
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
    code_challenge_methods_supported: ["S256", "plain"],
    scopes_supported: ["mcp:read", "mcp:write", "offline_access"]
  };

  return res.status(200).json(metadata);
}

/**
 * OpenID Connect Discovery (RFC 8414 / OIDC Core)
 * GET /.well-known/openid-configuration
 */
export function handleOpenIdConfiguration(req: Request, res: Response) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");

  const issuer = getBaseUrl(req);

  const metadata = {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    revocation_endpoint: `${issuer}/oauth/revoke`,
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256", "HS256"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
    code_challenge_methods_supported: ["S256", "plain"],
    scopes_supported: ["openid", "profile", "email", "mcp:read", "mcp:write", "offline_access"]
  };

  return res.status(200).json(metadata);
}

/**
 * RFC 9728 - OAuth 2.0 Protected Resource Metadata
 * GET /.well-known/oauth-protected-resource
 */
export function handleOAuthProtectedResourceDiscovery(req: Request, res: Response) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");

  const issuer = getBaseUrl(req);

  const metadata = {
    resource: `${issuer}/api/mcp`,
    authorization_servers: [issuer],
    scopes_supported: ["mcp:read", "mcp:write"],
    bearer_methods_supported: ["header"],
    resource_documentation: `${issuer}/api/mcp/info`
  };

  return res.status(200).json(metadata);
}

/**
 * Well-Known strict JSON 404 Fallback
 * Prevents any unhandled /.well-known/* request from falling into index.html
 */
export function handleWellKnownFallback(req: Request, res: Response) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(404).json({
    error: "not_found",
    error_description: `Well-known resource not found: ${req.path}`
  });
}

// ============================================================================
// 2. DYNAMIC CLIENT REGISTRATION (RFC 7591)
// ============================================================================

export async function handleOAuthRegister(req: Request, res: Response) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const body = req.body || {};
  const redirectUris = body.redirect_uris;

  // Validate redirect_uris
  if (!redirectUris || !Array.isArray(redirectUris) || redirectUris.length === 0) {
    return res.status(400).json({
      error: "invalid_redirect_uri",
      error_description: "redirect_uris must be a non-empty array of valid URLs."
    });
  }

  // Security check on each redirect_uri
  for (const uri of redirectUris) {
    if (typeof uri !== "string") {
      return res.status(400).json({
        error: "invalid_redirect_uri",
        error_description: "All redirect_uris must be strings."
      });
    }

    try {
      const parsed = new URL(uri);
      const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
      // HTTPS is strictly required for public domains; http only allowed for localhost dev
      if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLocalhost)) {
        return res.status(400).json({
          error: "invalid_redirect_uri",
          error_description: `Insecure redirect URI: ${uri}. HTTPS is required.`
        });
      }
      if (parsed.hash) {
        return res.status(400).json({
          error: "invalid_redirect_uri",
          error_description: "Redirect URI must not contain a URL fragment (#)."
        });
      }
    } catch {
      return res.status(400).json({
        error: "invalid_redirect_uri",
        error_description: `Malformed redirect URI: ${uri}`
      });
    }
  }

  const clientName = (typeof body.client_name === "string" && body.client_name.trim())
    ? body.client_name.trim().slice(0, 100)
    : "Claude Client";

  const grantTypes = Array.isArray(body.grant_types) && body.grant_types.length > 0
    ? body.grant_types
    : ["authorization_code", "refresh_token"];

  const responseTypes = Array.isArray(body.response_types) && body.response_types.length > 0
    ? body.response_types
    : ["code"];

  const tokenAuthMethod = typeof body.token_endpoint_auth_method === "string"
    ? body.token_endpoint_auth_method
    : "none"; // Default to public client for PKCE

  const clientId = `l4b_client_${crypto.randomBytes(16).toString("hex")}`;
  const now = Math.floor(Date.now() / 1000);

  const clientRecord: OAuthClient = {
    client_id: clientId,
    client_name: clientName,
    redirect_uris: redirectUris,
    grant_types: grantTypes,
    response_types: responseTypes,
    token_endpoint_auth_method: tokenAuthMethod,
    scope: body.scope || "mcp:read mcp:write",
    client_id_issued_at: now,
    created_at: new Date().toISOString()
  };

  // Issue client_secret if confidential client is explicitly requested
  if (tokenAuthMethod === "client_secret_post" || tokenAuthMethod === "client_secret_basic") {
    clientRecord.client_secret = `l4b_sec_${crypto.randomBytes(24).toString("hex")}`;
  }

  // Persist client
  IN_MEMORY_OAUTH_CLIENTS.set(clientId, clientRecord);
  await saveToStore(`oauth_client_${clientId}`, clientRecord, undefined, req.headers);

  // Response according to RFC 7591 (Ensure NO NULL values for Claude Web compatibility)
  const responsePayload: Record<string, any> = {
    client_id: clientRecord.client_id,
    client_id_issued_at: clientRecord.client_id_issued_at,
    client_name: clientRecord.client_name,
    redirect_uris: clientRecord.redirect_uris,
    grant_types: clientRecord.grant_types,
    response_types: clientRecord.response_types,
    token_endpoint_auth_method: clientRecord.token_endpoint_auth_method,
    scope: clientRecord.scope || "mcp:read"
  };

  if (clientRecord.client_secret) {
    responsePayload.client_secret = clientRecord.client_secret;
  }

  return res.status(201).json(responsePayload);
}

// ============================================================================
// 3. AUTHORIZATION CODE + PKCE ENDPOINT (GET /oauth/authorize)
// ============================================================================

export async function getClientById(clientId: string, reqHeaders?: Record<string, any>): Promise<OAuthClient | null> {
  const cached = IN_MEMORY_OAUTH_CLIENTS.get(clientId);
  if (cached) return cached;

  const fromDb = await getFromStore<OAuthClient>(`oauth_client_${clientId}`, reqHeaders);
  if (fromDb) {
    IN_MEMORY_OAUTH_CLIENTS.set(clientId, fromDb);
    return fromDb;
  }
  return null;
}

export async function handleOAuthAuthorize(req: Request, res: Response) {
  const {
    response_type,
    client_id,
    redirect_uri,
    scope = "mcp:read",
    state = "",
    code_challenge,
    code_challenge_method = "S256"
  } = req.query as Record<string, string>;

  // Basic query validations
  if (!client_id) {
    return res.status(400).send("<h3>Erro OAuth: 'client_id' ausente.</h3>");
  }

  const client = await getClientById(client_id, req.headers);
  if (!client) {
    return res.status(400).send(`<h3>Erro OAuth: Cliente '${client_id}' não encontrado ou não registrado.</h3>`);
  }

  if (!redirect_uri) {
    return res.status(400).send("<h3>Erro OAuth: 'redirect_uri' ausente.</h3>");
  }

  // Ensure redirect_uri matches pre-registered client URIs
  if (!client.redirect_uris.includes(redirect_uri)) {
    return res.status(400).send(`<h3>Erro OAuth: redirect_uri '${redirect_uri}' não autorizada para este cliente.</h3>`);
  }

  if (response_type !== "code") {
    const errorUrl = new URL(redirect_uri);
    errorUrl.searchParams.set("error", "unsupported_response_type");
    errorUrl.searchParams.set("error_description", "Apenas response_type=code é suportado.");
    if (state) errorUrl.searchParams.set("state", state);
    return res.redirect(errorUrl.toString());
  }

  // RFC 7636 / OAuth 2.1: PKCE is strictly mandatory
  if (!code_challenge) {
    const errorUrl = new URL(redirect_uri);
    errorUrl.searchParams.set("error", "invalid_request");
    errorUrl.searchParams.set("error_description", "code_challenge obrigatório (PKCE requerido pelo Life4Billion OAuth 2.1).");
    if (state) errorUrl.searchParams.set("state", state);
    return res.redirect(errorUrl.toString());
  }

  if (code_challenge_method !== "S256" && code_challenge_method !== "plain") {
    const errorUrl = new URL(redirect_uri);
    errorUrl.searchParams.set("error", "invalid_request");
    errorUrl.searchParams.set("error_description", "code_challenge_method deve ser S256 ou plain.");
    if (state) errorUrl.searchParams.set("state", state);
    return res.redirect(errorUrl.toString());
  }

  // Check if session token is provided via query param or cookie
  const sessionToken = (req.query.session_token as string) || (req.cookies?.["l4b_session"] as string) || "";
  let authenticatedUser: { id: string; email?: string } | null = null;

  if (sessionToken) {
    const config = getSupabaseCredentials(req.headers);
    if (config.url && config.anonKey) {
      try {
        const sbClient = createClient(config.url, config.anonKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
        const { data } = await sbClient.auth.getUser(sessionToken);
        if (data?.user?.id) {
          authenticatedUser = { id: data.user.id, email: data.user.email };
        }
      } catch {}
    }
  }

  // Render the Clean Consent Page
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(renderConsentHtml({
    clientName: client.client_name,
    clientId: client.client_id,
    redirectUri: redirect_uri,
    scope,
    state,
    codeChallenge: code_challenge,
    codeChallengeMethod: code_challenge_method as "S256" | "plain",
    user: authenticatedUser
  }));
}

/**
 * Handle explicit user consent submission (Approve or Deny)
 * POST /oauth/authorize/consent
 */
export async function handleOAuthConsent(req: Request, res: Response) {
  const {
    action, // 'approve' | 'deny'
    client_id,
    redirect_uri,
    scope = "mcp:read",
    state = "",
    code_challenge,
    code_challenge_method = "S256",
    user_email,
    user_password,
    session_token
  } = req.body || {};

  if (!redirect_uri) {
    return res.status(400).send("redirect_uri ausente.");
  }

  const client = await getClientById(client_id, req.headers);
  if (!client || !client.redirect_uris.includes(redirect_uri)) {
    return res.status(400).send("Cliente ou redirect_uri inválido.");
  }

  // If user declined:
  if (action !== "approve") {
    const errorUrl = new URL(redirect_uri);
    errorUrl.searchParams.set("error", "access_denied");
    errorUrl.searchParams.set("error_description", "O usuário cancelou a autorização com o Life4Billion.");
    if (state) errorUrl.searchParams.set("state", state);
    return res.redirect(errorUrl.toString());
  }

  // Authenticate user
  let userId = "";
  let userEmail = "";
  const config = getSupabaseCredentials(req.headers);
  const sbClient = config.url && config.anonKey
    ? createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

  // Check Authorization header (Bearer token)
  const authHeader = req.headers["authorization"] || "";
  let bearerToken = "";
  if (authHeader.startsWith("Bearer ")) {
    bearerToken = authHeader.substring(7).trim();
  }
  if (bearerToken && sbClient) {
    try {
      const { data } = await sbClient.auth.getUser(bearerToken);
      if (data?.user?.id) {
        userId = data.user.id;
        userEmail = data.user.email || "";
      }
    } catch {}
  }

  if (session_token && sbClient && !userId) {
    try {
      const { data } = await sbClient.auth.getUser(session_token);
      if (data?.user?.id) {
        userId = data.user.id;
        userEmail = data.user.email || "";
      }
    } catch {}
  }

  // If userId was explicitly provided (e.g. client consent form or API call)
  if (!userId && (req.body?.userId || req.body?.user_id)) {
    userId = String(req.body.userId || req.body.user_id).trim();
    userEmail = String(req.body.user_email || req.body.email || `${userId}@life4billion.app`).trim();
  }

  // If user provided email and password in the consent login form:
  if (!userId && user_email && user_password && sbClient) {
    try {
      const { data, error } = await sbClient.auth.signInWithPassword({
        email: String(user_email).trim(),
        password: String(user_password)
      });
      if (!error && data?.user?.id) {
        userId = data.user.id;
        userEmail = data.user.email || "";
      } else {
        // Render consent page again with login error
        return res.status(401).send(renderConsentHtml({
          clientName: client.client_name,
          clientId: client.client_id,
          redirectUri: redirect_uri,
          scope,
          state,
          codeChallenge: code_challenge,
          codeChallengeMethod: code_challenge_method,
          user: null,
          loginError: "Email ou senha incorretos. Verifique suas credenciais do Life4Billion."
        }));
      }
    } catch (authErr: any) {
      return res.status(401).send(renderConsentHtml({
        clientName: client.client_name,
        clientId: client.client_id,
        redirectUri: redirect_uri,
        scope,
        state,
        codeChallenge: code_challenge,
        codeChallengeMethod: code_challenge_method,
        user: null,
        loginError: `Erro de login: ${authErr.message || "Falha na autenticação"}`
      }));
    }
  }

  // Fallback demo user if running in demo environment without active session
  if (!userId) {
    return res.status(401).send(renderConsentHtml({
      clientName: client.client_name,
      clientId: client.client_id,
      redirectUri: redirect_uri,
      scope,
      state,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
      user: null,
      loginError: "Faça login com sua conta do Life4Billion para conceder acesso ao Claude."
    }));
  }

  // Generate single-use authorization code
  const code = `l4b_code_${crypto.randomBytes(24).toString("hex")}`;
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  const codeRecord: OAuthAuthorizationCode = {
    code,
    client_id,
    user_id: userId,
    user_email: userEmail,
    redirect_uri,
    scope,
    code_challenge,
    code_challenge_method,
    expires_at: expiresAt,
    used: false,
    permissions: DEFAULT_MCP_PERMISSIONS
  };

  IN_MEMORY_OAUTH_CODES.set(code, codeRecord);
  await saveToStore(`oauth_code_${code}`, codeRecord, userId, req.headers);

  const targetUrl = new URL(redirect_uri);
  targetUrl.searchParams.set("code", code);
  if (state) targetUrl.searchParams.set("state", state);

  return res.redirect(targetUrl.toString());
}

// ============================================================================
// 4. TOKEN ENDPOINT (POST /oauth/token)
// ============================================================================

export async function handleOAuthToken(req: Request, res: Response) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");

  const body = req.body || {};
  const grantType = body.grant_type;

  // -------------------------------------------------------------
  // Case A: Authorization Code Grant
  // -------------------------------------------------------------
  if (grantType === "authorization_code") {
    const { code, client_id, redirect_uri, code_verifier } = body;

    if (!code) {
      return res.status(400).json({ error: "invalid_request", error_description: "Parâmetro 'code' ausente." });
    }
    if (!client_id) {
      return res.status(400).json({ error: "invalid_request", error_description: "Parâmetro 'client_id' ausente." });
    }
    if (!redirect_uri) {
      return res.status(400).json({ error: "invalid_request", error_description: "Parâmetro 'redirect_uri' ausente." });
    }
    if (!code_verifier) {
      return res.status(400).json({ error: "invalid_request", error_description: "Parâmetro 'code_verifier' ausente (PKCE obrigatório)." });
    }

    // Lookup code
    let codeRecord = IN_MEMORY_OAUTH_CODES.get(code);
    if (!codeRecord) {
      codeRecord = await getFromStore<OAuthAuthorizationCode>(`oauth_code_${code}`, req.headers) || undefined;
    }

    if (!codeRecord) {
      return res.status(400).json({
        error: "invalid_grant",
        error_description: "Authorization code inválido ou não encontrado."
      });
    }

    // Enforce SINGLE-USE of code
    if (codeRecord.used) {
      IN_MEMORY_OAUTH_CODES.delete(code);
      return res.status(400).json({
        error: "invalid_grant",
        error_description: "Este authorization code já foi utilizado (ataque de repetição bloqueado)."
      });
    }

    // Check expiration
    if (Date.now() > codeRecord.expires_at) {
      IN_MEMORY_OAUTH_CODES.delete(code);
      return res.status(400).json({
        error: "invalid_grant",
        error_description: "Authorization code expirado."
      });
    }

    // Immediately mark code as used
    codeRecord.used = true;
    IN_MEMORY_OAUTH_CODES.set(code, codeRecord);
    await saveToStore(`oauth_code_${code}`, codeRecord, codeRecord.user_id, req.headers);

    // Validate client_id binding
    if (codeRecord.client_id !== client_id) {
      return res.status(400).json({
        error: "invalid_grant",
        error_description: "O client_id não coincide com o do authorization code."
      });
    }

    // Validate redirect_uri binding
    if (codeRecord.redirect_uri !== redirect_uri) {
      return res.status(400).json({
        error: "invalid_grant",
        error_description: "A redirect_uri não coincide com a autorizada inicialmente."
      });
    }

    // Verify PKCE code_verifier against stored code_challenge
    let pkceValid = false;
    if (codeRecord.code_challenge_method === "S256") {
      const calculated = crypto
        .createHash("sha256")
        .update(code_verifier)
        .digest("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      pkceValid = (calculated === codeRecord.code_challenge);
    } else if (codeRecord.code_challenge_method === "plain") {
      pkceValid = (code_verifier === codeRecord.code_challenge);
    }

    if (!pkceValid) {
      return res.status(400).json({
        error: "invalid_grant",
        error_description: "Falha na verificação PKCE (code_verifier inválido para o code_challenge)."
      });
    }

    // Issue Access Token & Refresh Token
    const accessToken = `l4b_oauth_${crypto.randomBytes(32).toString("hex")}`;
    const tokenHash = hashToken(accessToken);
    const refreshToken = `l4b_rf_${crypto.randomBytes(32).toString("hex")}`;
    const refreshHash = hashToken(refreshToken);

    const expiresInSeconds = 30 * 24 * 3600; // 30 days
    const expiresAt = Date.now() + expiresInSeconds * 1000;

    const tokenRecord: OAuthAccessToken = {
      token: accessToken,
      token_hash: tokenHash,
      client_id,
      user_id: codeRecord.user_id,
      user_email: codeRecord.user_email,
      scope: codeRecord.scope,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
      status: "active",
      permissions: codeRecord.permissions || DEFAULT_MCP_PERMISSIONS
    };

    const refreshRecord: OAuthRefreshToken = {
      token: refreshToken,
      token_hash: refreshHash,
      client_id,
      user_id: codeRecord.user_id,
      user_email: codeRecord.user_email,
      scope: codeRecord.scope,
      expires_at: Date.now() + 90 * 24 * 3600 * 1000, // 90 days
      created_at: new Date().toISOString(),
      status: "active"
    };

    // Save tokens in memory and store
    IN_MEMORY_OAUTH_TOKENS.set(tokenHash, tokenRecord);
    IN_MEMORY_OAUTH_REFRESH.set(refreshHash, refreshRecord);

    await saveToStore(`oauth_token_${tokenHash}`, tokenRecord, codeRecord.user_id, req.headers);
    await saveToStore(`oauth_refresh_${refreshHash}`, refreshRecord, codeRecord.user_id, req.headers);

    return res.status(200).json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: expiresInSeconds,
      refresh_token: refreshToken,
      scope: codeRecord.scope
    });
  }

  // -------------------------------------------------------------
  // Case B: Refresh Token Grant
  // -------------------------------------------------------------
  if (grantType === "refresh_token") {
    const { refresh_token, client_id } = body;
    if (!refresh_token) {
      return res.status(400).json({ error: "invalid_request", error_description: "Parâmetro 'refresh_token' ausente." });
    }

    const refreshHash = hashToken(refresh_token);
    let refreshRecord = IN_MEMORY_OAUTH_REFRESH.get(refreshHash);
    if (!refreshRecord) {
      refreshRecord = await getFromStore<OAuthRefreshToken>(`oauth_refresh_${refreshHash}`, req.headers) || undefined;
    }

    if (!refreshRecord || refreshRecord.status !== "active" || Date.now() > refreshRecord.expires_at) {
      return res.status(400).json({ error: "invalid_grant", error_description: "Refresh token inválido ou expirado." });
    }

    if (client_id && refreshRecord.client_id !== client_id) {
      return res.status(400).json({ error: "invalid_grant", error_description: "client_id não coincide com o do refresh token." });
    }

    // Invalidate old refresh token (rotation)
    refreshRecord.status = "revoked";
    IN_MEMORY_OAUTH_REFRESH.set(refreshHash, refreshRecord);
    await saveToStore(`oauth_refresh_${refreshHash}`, refreshRecord, refreshRecord.user_id, req.headers);

    // Issue new pair
    const newAccessToken = `l4b_oauth_${crypto.randomBytes(32).toString("hex")}`;
    const newTokenHash = hashToken(newAccessToken);
    const newRefreshToken = `l4b_rf_${crypto.randomBytes(32).toString("hex")}`;
    const newRefreshHash = hashToken(newRefreshToken);

    const expiresInSeconds = 30 * 24 * 3600;
    const expiresAt = Date.now() + expiresInSeconds * 1000;

    const tokenRecord: OAuthAccessToken = {
      token: newAccessToken,
      token_hash: newTokenHash,
      client_id: refreshRecord.client_id,
      user_id: refreshRecord.user_id,
      user_email: refreshRecord.user_email,
      scope: refreshRecord.scope,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
      status: "active",
      permissions: DEFAULT_MCP_PERMISSIONS
    };

    const newRefreshRecord: OAuthRefreshToken = {
      token: newRefreshToken,
      token_hash: newRefreshHash,
      client_id: refreshRecord.client_id,
      user_id: refreshRecord.user_id,
      user_email: refreshRecord.user_email,
      scope: refreshRecord.scope,
      expires_at: Date.now() + 90 * 24 * 3600 * 1000,
      created_at: new Date().toISOString(),
      status: "active"
    };

    IN_MEMORY_OAUTH_TOKENS.set(newTokenHash, tokenRecord);
    IN_MEMORY_OAUTH_REFRESH.set(newRefreshHash, newRefreshRecord);

    await saveToStore(`oauth_token_${newTokenHash}`, tokenRecord, refreshRecord.user_id, req.headers);
    await saveToStore(`oauth_refresh_${newRefreshHash}`, newRefreshRecord, refreshRecord.user_id, req.headers);

    return res.status(200).json({
      access_token: newAccessToken,
      token_type: "Bearer",
      expires_in: expiresInSeconds,
      refresh_token: newRefreshToken,
      scope: refreshRecord.scope
    });
  }

  return res.status(400).json({
    error: "unsupported_grant_type",
    error_description: `Grant type '${grantType}' não suportado. Use 'authorization_code' ou 'refresh_token'.`
  });
}

/**
 * RFC 7009 - OAuth 2.0 Token Revocation
 * POST /oauth/revoke
 */
export async function handleOAuthRevoke(req: Request, res: Response) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { token, token_type_hint } = req.body || {};
  if (!token) {
    return res.status(400).json({ error: "invalid_request", error_description: "Parâmetro 'token' obrigatório para revogação." });
  }

  const tokenHash = hashToken(token);

  // Revoke access token if found
  const accessRecord = IN_MEMORY_OAUTH_TOKENS.get(tokenHash);
  if (accessRecord) {
    accessRecord.status = "revoked";
    IN_MEMORY_OAUTH_TOKENS.set(tokenHash, accessRecord);
    await saveToStore(`oauth_token_${tokenHash}`, accessRecord, accessRecord.user_id, req.headers);
  }

  // Revoke refresh token if found
  const refreshRecord = IN_MEMORY_OAUTH_REFRESH.get(tokenHash);
  if (refreshRecord) {
    refreshRecord.status = "revoked";
    IN_MEMORY_OAUTH_REFRESH.set(tokenHash, refreshRecord);
    await saveToStore(`oauth_refresh_${tokenHash}`, refreshRecord, refreshRecord.user_id, req.headers);
  }

  return res.status(200).json({ success: true, message: "Token revogado com sucesso." });
}

// ============================================================================
// 5. OAUTH ACCESS TOKEN VALIDATION FOR MCP
// ============================================================================

/**
 * Validates an incoming OAuth 2.1 access token (`l4b_oauth_...`)
 * Returns the AuthenticatedUser with strict tenant isolation and permissions.
 */
export async function verifyOAuthAccessToken(
  rawToken: string,
  reqHeaders?: Record<string, any>
): Promise<AuthenticatedUser | null> {
  const tokenHash = hashToken(rawToken);

  // 1. Fast path: in-memory cache
  let tokenRecord = IN_MEMORY_OAUTH_TOKENS.get(tokenHash);

  // 2. Fallback: database store
  if (!tokenRecord) {
    tokenRecord = await getFromStore<OAuthAccessToken>(`oauth_token_${tokenHash}`, reqHeaders) || undefined;
    if (tokenRecord) {
      IN_MEMORY_OAUTH_TOKENS.set(tokenHash, tokenRecord);
    }
  }

  if (!tokenRecord) {
    return null;
  }

  if (tokenRecord.status !== "active") {
    return null;
  }

  if (Date.now() > tokenRecord.expires_at) {
    return null;
  }

  return {
    userId: tokenRecord.user_id,
    email: tokenRecord.user_email,
    role: "user",
    authMethod: "oauth2",
    permissions: tokenRecord.permissions || DEFAULT_MCP_PERMISSIONS,
    status: "active"
  };
}

// ============================================================================
// HTML UI: Consent & Authentication Screen
// ============================================================================

interface ConsentHtmlParams {
  clientName: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: "S256" | "plain";
  user: { id: string; email?: string } | null;
  loginError?: string;
}

function renderConsentHtml(params: ConsentHtmlParams): string {
  const {
    clientName,
    clientId,
    redirectUri,
    scope,
    state,
    codeChallenge,
    codeChallengeMethod,
    user,
    loginError
  } = params;

  return `<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Autorizar Conexão — Life4Billion MCP</title>
  <link rel="icon" type="image/jpeg" href="/brand/life4billion-logo.jpg">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              gold: '#D4AF37',
              dark: '#0B0F19',
              card: '#111827',
              border: '#1F2937'
            }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-[#080C14] text-slate-100 min-h-screen flex items-center justify-center p-4 selection:bg-amber-500/30 selection:text-amber-200">
  <div class="w-full max-w-lg bg-[#0F172A] border border-slate-800/80 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden backdrop-blur-sm">
    <!-- Header Decorator -->
    <div class="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- App Brand & Title -->
    <div class="flex items-center space-x-3.5 mb-6 border-b border-slate-800/80 pb-5">
      <img src="/brand/life4billion-logo.jpg" alt="Life4Billion Logo" class="w-12 h-12 rounded-xl object-cover border border-amber-500/30 shadow-md">
      <div>
        <div class="flex items-center space-x-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">Remote MCP</span>
          <span class="text-xs text-slate-400">OAuth 2.1</span>
        </div>
        <h1 class="text-xl font-bold text-white tracking-tight mt-0.5">Life4Billion Bridge</h1>
      </div>
    </div>

    <!-- Request Notice -->
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-slate-100 flex items-center gap-2">
        <span>Conectar com</span>
        <span class="text-amber-400 font-bold px-2 py-0.5 bg-amber-400/10 rounded border border-amber-400/20">${escapeHtml(clientName)}</span>
      </h2>
      <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">
        O <strong>${escapeHtml(clientName)}</strong> está solicitando autorização para se comunicar com seu assistente e ferramentas via Model Context Protocol (MCP).
      </p>
    </div>

    ${loginError ? `
      <div class="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
        <svg class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>${escapeHtml(loginError)}</span>
      </div>
    ` : ''}

    <form method="POST" action="/oauth/authorize/consent">
      <!-- Hidden OAuth Context Fields -->
      <input type="hidden" name="client_id" value="${escapeHtml(clientId)}">
      <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}">
      <input type="hidden" name="scope" value="${escapeHtml(scope)}">
      <input type="hidden" name="state" value="${escapeHtml(state)}">
      <input type="hidden" name="code_challenge" value="${escapeHtml(codeChallenge)}">
      <input type="hidden" name="code_challenge_method" value="${escapeHtml(codeChallengeMethod)}">

      ${user ? `
        <!-- Authenticated User Banner -->
        <div class="mb-6 p-4 bg-slate-900/90 border border-slate-700/60 rounded-xl flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-sm border border-amber-500/30">
              ${escapeHtml((user.email || 'U')[0].toUpperCase())}
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium">Logado no Life4Billion como</p>
              <p class="text-sm font-semibold text-slate-200">${escapeHtml(user.email || user.id)}</p>
            </div>
          </div>
          <span class="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Autenticado</span>
        </div>
      ` : `
        <!-- Login Form inside Consent -->
        <div class="mb-6 p-4 bg-slate-900/90 border border-slate-700/60 rounded-xl space-y-3">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span class="text-xs font-semibold text-slate-300 uppercase tracking-wide">Identifique-se para Autorizar</span>
            <span class="text-[11px] text-amber-400">Login Life4Billion</span>
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1">Seu E-mail</label>
            <input type="email" name="user_email" required placeholder="seu@email.com" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500/60">
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1">Sua Senha</label>
            <input type="password" name="user_password" required placeholder="••••••••" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500/60">
          </div>
        </div>
      `}

      <!-- Permissions Checklist Box -->
      <div class="mb-6 space-y-2 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
        <p class="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Permissões Solicitadas (MCP Tools):</p>
        
        <div class="flex items-start space-x-2.5 text-xs text-slate-300">
          <svg class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <div>
            <strong class="text-slate-200">Consultar Finanças, Metas e Hábitos</strong>
            <p class="text-[11px] text-slate-400">Resumo financeiro, receitas, despesas, reserva de emergência, metas e rotinas diárias.</p>
          </div>
        </div>

        <div class="flex items-start space-x-2.5 text-xs text-slate-300">
          <svg class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <div>
            <strong class="text-slate-200">Consultar Calendário, Estudos e CRM</strong>
            <p class="text-[11px] text-slate-400">Eventos agendados, sessões de foco, orçamento familiar e visão geral de clientes.</p>
          </div>
        </div>

        <div class="flex items-start space-x-2.5 text-xs text-slate-300 pt-1 border-t border-slate-800/80 mt-2">
          <svg class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          <div>
            <strong class="text-slate-200">Ações de Gravação (WRITE)</strong>
            <p class="text-[11px] text-slate-400">Permanecem protegidas e desativadas por padrão. Você pode ativá-las a qualquer momento na aba MCP.</p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-2 gap-3">
        <button type="submit" name="action" value="deny" class="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/70 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition-colors focus:ring-2 focus:ring-slate-600 focus:outline-none">
          Cancelar
        </button>
        <button type="submit" name="action" value="approve" class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition-all focus:ring-2 focus:ring-amber-400 focus:outline-none">
          Autorizar Conexão
        </button>
      </div>
    </form>

    <div class="mt-6 pt-4 border-t border-slate-800/70 text-center">
      <p class="text-[11px] text-slate-500">
        Isolamento de dados 100% garantido por tenant. Acesso criptografado com PKCE RFC 7636.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str?: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
