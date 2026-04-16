import { createAdminClient } from '@/lib/supabase-admin';
import { createHash } from 'crypto';
import type { AuditEventCategory } from '@prisma/client';

const ALLOWED_METADATA_KEYS = new Set([
  'event_id',
  'pattern_id',
  'count',
  'error_code',
  'target_id',
  'tier',
  'role',
  'workspace_id',
  'platform_connection_id',
  'scan_id',
  'share_id',
  'route',
  'method',
  'status_code',
]);

function sanitizeMetadata(raw: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (ALLOWED_METADATA_KEYS.has(key)) {
      clean[key] = typeof value === 'string' ? value.slice(0, 500) : value;
    }
  }
  return clean;
}

function hashIp(ip: string): string {
  const daySalt = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${ip}:${daySalt}`).digest('hex').slice(0, 16);
}

function parseUserAgentFamily(ua: string | null): string | null {
  if (!ua) return null;
  if (ua.includes('Chrome')) return 'chrome';
  if (ua.includes('Safari')) return 'safari';
  if (ua.includes('Firefox')) return 'firefox';
  if (ua.includes('Edge')) return 'edge';
  if (ua.includes('curl')) return 'curl';
  if (ua.includes('node')) return 'node';
  return 'other';
}

interface LogEventParams {
  category: AuditEventCategory;
  eventType: string;
  userId?: string | null;
  workspaceId?: string | null;
  success?: boolean;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}

export async function logSecurityEvent(params: LogEventParams): Promise<void> {
  try {
    const supabase = createAdminClient();

    await supabase.from('SecurityAuditLog').insert({
      category: params.category,
      event_type: params.eventType,
      user_id: params.userId ?? null,
      workspace_id: params.workspaceId ?? null,
      success: params.success ?? true,
      metadata: params.metadata ? sanitizeMetadata(params.metadata) : {},
      ip_hash: params.ip ? hashIp(params.ip) : null,
      user_agent_family: parseUserAgentFamily(params.userAgent ?? null),
    });
  } catch (error) {
    console.error('[AuditLog] Failed to write event:', error);
  }
}

export function getClientIp(headers: Headers): string | null {
  return (
    headers.get('x-vercel-forwarded-for') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    null
  );
}
