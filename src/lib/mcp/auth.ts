import prisma from '@/lib/db';
import { hashApiKey } from '@/lib/api-auth';

// BrandOS MCP auth: a self-serve API key (bos_...) sent as a bearer token
// (or x-api-key). Optional: scan_brand works without one. Only keys linked to
// a user (migration 029) unlock that user's brand tools.

export interface McpAuthExtra extends Record<string, unknown> {
  userId: string;
  workspaceId: string | null;
  apiKeyId: string;
}

export interface McpAuthInfo {
  token: string;
  clientId: string;
  scopes: string[];
  extra: McpAuthExtra;
}

const KEY_RE = /^bos_[0-9a-f]{32}$/;

export async function verifyMcpToken(
  req: Request,
  bearerToken?: string
): Promise<McpAuthInfo | undefined> {
  const raw = (bearerToken || req.headers.get('x-api-key') || '').trim();
  if (!KEY_RE.test(raw)) return undefined;

  const apiKey = await prisma.apiKey.findUnique({ where: { key: hashApiKey(raw) } });
  if (!apiKey || !apiKey.isActive || !apiKey.userId) return undefined;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return undefined;

  return {
    token: apiKey.prefix, // never echo the raw key
    clientId: apiKey.id,
    scopes: ['brand:read', 'brand:check'],
    extra: { userId: apiKey.userId, workspaceId: apiKey.workspaceId, apiKeyId: apiKey.id },
  };
}
